// Global type declarations for express
declare module 'express' {
  export interface Request extends NodeJS.ReadableStream {
    app: any;
    baseUrl: string;
    body: any;
    cookies: any;
    fresh: boolean;
    hostname: string;
    ip: string;
    ips: string[];
    originalUrl: string;
    params: any;
    path: string;
    protocol: string;
    query: any;
    route: any;
    secure: boolean;
    signedCookies: any;
    stale: boolean;
    subdomains: string[];
    xhr: boolean;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export interface Response extends NodeJS.WritableStream {
    app: any;
    headersSent: boolean;
    locals: any;
    append(field: string, value: string | string[]): this;
    attachment(filename?: string): this;
    cookie(name: string, val: string, options?: any): this;
    clearCookie(name: string, options?: any): this;
    download(path: string, filename?: string, callback?: (err?: Error) => void): void;
    format(obj: any): this;
    get(field: string): string;
    json(body?: any): this;
    jsonp(body?: any): this;
    links(links: any): this;
    location(path: string): this;
    redirect(url: string): void;
    redirect(status: number, url: string): void;
    render(view: string, options?: any, callback?: (err: Error, html: string) => void): void;
    send(body?: any): this;
    sendFile(path: string, options?: any, callback?: (err?: Error) => void): void;
    sendStatus(status: number): this;
    set(field: string, value?: string | string[]): this;
    set(headers: { [key: string]: string | string[] }): this;
    status(code: number): this;
    type(type: string): this;
    vary(field: string | string[]): this;
    write(chunk: any, encoding?: string): boolean;
    end(): this;
  }
}

