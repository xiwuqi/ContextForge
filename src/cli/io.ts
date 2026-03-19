export interface CliIO {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

export interface CliRuntime {
  cwd: string;
  io: CliIO;
  setExitCode: (code: number) => void;
}

export function createDefaultIO(): CliIO {
  return {
    stdout: (message) => process.stdout.write(`${message}\n`),
    stderr: (message) => process.stderr.write(`${message}\n`),
  };
}

export function printJson(io: CliIO, value: unknown): void {
  io.stdout(JSON.stringify(value, null, 2));
}
