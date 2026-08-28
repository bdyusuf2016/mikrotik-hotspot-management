import net from 'net';
import tls from 'tls';
import crypto from 'crypto';

export interface RouterOSSocketOptions {
  host: string;
  port: number;
  useSsl?: boolean;
  username: string;
  password?: string;
  timeoutMs?: number;
}

export interface RouterOSSentence {
  type: '!done' | '!re' | '!trap' | '!empty' | '!fatal';
  attributes: Record<string, string>;
}

export class RouterOSSocketClient {
  private socket: net.Socket | null = null;
  private connected = false;
  private buffer: Buffer = Buffer.alloc(0);

  constructor(private readonly options: RouterOSSocketOptions) {}

  public async connect(): Promise<void> {
    const timeout = this.options.timeoutMs || 5000;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.socket) this.socket.destroy();
        reject(new Error(`Connection to ${this.options.host}:${this.options.port} timed out after ${timeout}ms`));
      }, timeout);

      const onConnect = () => {
        clearTimeout(timer);
        this.connected = true;
        resolve();
      };

      if (this.options.useSsl) {
        this.socket = tls.connect(
          {
            host: this.options.host,
            port: this.options.port,
            rejectUnauthorized: false
          },
          onConnect
        );
      } else {
        this.socket = net.createConnection(
          {
            host: this.options.host,
            port: this.options.port
          },
          onConnect
        );
      }

      this.socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    // Perform RouterOS Login
    await this.login(this.options.username, this.options.password || '');
  }

  private async login(username: string, password: string): Promise<void> {
    const res = await this.write(['/login', `=name=${username}`, `=password=${password}`]);
    const first = res.find(s => s.type === '!done' || s.type === '!trap');
    if (!first) throw new Error('RouterOS login returned no response');

    if (first.type === '!trap') {
      const msg = first.attributes.message || 'Authentication failed';
      throw new Error(`RouterOS Authentication Error: ${msg}`);
    }

    if (first.attributes.ret) {
      // Legacy challenge-response flow
      const chal = Buffer.from(first.attributes.ret, 'hex');
      const md5 = crypto.createHash('md5');
      md5.update(Buffer.from('\x00', 'binary'));
      md5.update(Buffer.from(password, 'utf-8'));
      md5.update(chal);
      const digest = `00${md5.digest('hex')}`;
      const chalRes = await this.write(['/login', `=name=${username}`, `=response=${digest}`]);
      const chalFirst = chalRes.find(s => s.type === '!trap');
      if (chalFirst) {
        throw new Error(`RouterOS Challenge Auth Error: ${chalFirst.attributes?.message || 'Login failed'}`);
      }
    }
  }

  public async write(words: string[]): Promise<RouterOSSentence[]> {
    if (!this.socket || !this.connected) {
      throw new Error('Socket is not connected');
    }

    const packet = this.encodeSentence(words);
    this.socket.write(packet);

    return this.readSentenceResponse();
  }

  private async readSentenceResponse(): Promise<RouterOSSentence[]> {
    const sentences: RouterOSSentence[] = [];

    while (true) {
      const sentence = await this.readOneSentence();
      if (!sentence) continue;

      sentences.push(sentence);

      if (sentence.type === '!done') {
        break;
      } else if (sentence.type === '!trap') {
        break;
      } else if (sentence.type === '!fatal') {
        break;
      }
      // For !re and !empty, continue reading until !done finishes the response block
    }

    return sentences;
  }

  private async readOneSentence(): Promise<RouterOSSentence | null> {
    const words: string[] = [];

    while (true) {
      const word = await this.readWord();
      if (word === null) return null;
      if (word === '') {
        // Empty word marks end of sentence
        if (words.length === 0) return null;
        const type = words[0] as RouterOSSentence['type'];
        const attributes: Record<string, string> = {};
        for (let i = 1; i < words.length; i++) {
          const w = words[i];
          if (w.startsWith('=')) {
            const eqIdx = w.indexOf('=', 1);
            if (eqIdx !== -1) {
              const key = w.substring(1, eqIdx);
              const val = w.substring(eqIdx + 1);
              attributes[key] = val;
            } else {
              attributes[w.substring(1)] = 'true';
            }
          } else if (w.startsWith('.tag=')) {
            attributes['.tag'] = w.substring(5);
          }
        }
        return { type, attributes };
      }
      words.push(word);
    }
  }

  private async readWord(): Promise<string | null> {
    while (true) {
      const lengthInfo = this.decodeLength(this.buffer);
      if (!lengthInfo) {
        await this.waitForData();
        continue;
      }

      const totalNeeded = lengthInfo.headerLength + lengthInfo.wordLength;
      if (this.buffer.length < totalNeeded) {
        await this.waitForData();
        continue;
      }

      const wordBuffer = this.buffer.subarray(
        lengthInfo.headerLength,
        lengthInfo.headerLength + lengthInfo.wordLength
      );
      this.buffer = this.buffer.subarray(totalNeeded);
      return wordBuffer.toString('utf-8');
    }
  }

  private decodeLength(buf: Buffer): { wordLength: number; headerLength: number } | null {
    if (buf.length === 0) return null;
    const b0 = buf[0];
    if ((b0 & 0x80) === 0x00) {
      return { wordLength: b0, headerLength: 1 };
    } else if ((b0 & 0xc0) === 0x80) {
      if (buf.length < 2) return null;
      return { wordLength: ((b0 & 0x3f) << 8) | buf[1], headerLength: 2 };
    } else if ((b0 & 0xe0) === 0xc0) {
      if (buf.length < 3) return null;
      return { wordLength: ((b0 & 0x1f) << 16) | (buf[1] << 8) | buf[2], headerLength: 3 };
    } else if ((b0 & 0xf0) === 0xe0) {
      if (buf.length < 4) return null;
      return { wordLength: ((b0 & 0x0f) << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3], headerLength: 4 };
    }
    return null;
  }

  private encodeSentence(words: string[]): Buffer {
    const buffers: Buffer[] = [];
    for (const word of words) {
      const wordBuf = Buffer.from(word, 'utf-8');
      const lenBuf = this.encodeLength(wordBuf.length);
      buffers.push(lenBuf, wordBuf);
    }
    buffers.push(Buffer.from([0x00])); // zero byte sentence terminator
    return Buffer.concat(buffers);
  }

  private encodeLength(len: number): Buffer {
    if (len < 0x80) {
      return Buffer.from([len]);
    } else if (len < 0x4000) {
      return Buffer.from([(len >> 8) | 0x80, len & 0xff]);
    } else if (len < 0x200000) {
      return Buffer.from([(len >> 16) | 0xc0, (len >> 8) & 0xff, len & 0xff]);
    } else if (len < 0x10000000) {
      return Buffer.from([(len >> 24) | 0xe0, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]);
    }
    throw new Error(`Word length ${len} exceeds max supported length`);
  }

  private waitForData(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket disconnected'));
        return;
      }
      const onData = (chunk: Buffer) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        cleanup();
        resolve();
      };
      const onClose = () => {
        cleanup();
        reject(new Error('Socket closed while reading'));
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        if (!this.socket) return;
        this.socket.off('data', onData);
        this.socket.off('close', onClose);
        this.socket.off('error', onError);
      };
      this.socket.on('data', onData);
      this.socket.on('close', onClose);
      this.socket.on('error', onError);
    });
  }

  public async close(): Promise<void> {
    this.connected = false;
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}
