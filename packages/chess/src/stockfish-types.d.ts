declare module 'stockfish' {
  export interface StockfishInstance {
    processCommand(cmd: string): void;
    terminate(): void;
  }
  const factory: (listener: (line: string) => void) => StockfishInstance;
  export default factory;
}
