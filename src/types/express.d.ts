declare module 'express' {
  import * as http from 'http';
  
  export interface Request extends http.IncomingMessage {
    app: Application;
    baseUrl: string;
    body: any;
    cookies: any;
    [key: string]: any;
    on(event: string, callback: (...args: any[]) => void): this;
  }
  
  export interface Response extends http.ServerResponse {
    app: Application;
    headersSent: boolean;
    locals: any;
    write(data: string): boolean;
    setHeader(name: string, value: string): this;
    end(): void;
    [key: string]: any;
  }
  
  export interface Application {
    get(path: string, handler: (req: Request, res: Response) => void): void;
    listen(port: number, callback?: () => void): http.Server;
    [key: string]: any;
  }
  
  export default function express(): Application;
}

