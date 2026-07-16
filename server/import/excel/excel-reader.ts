import { read, type WorkBook } from 'xlsx';

export class ExcelReader {
  constructor(
    private readonly workbookReader: (input: ArrayBuffer | Buffer | Uint8Array | string) => WorkBook = read,
  ) {}

  public readWorkbook(input: ArrayBuffer | Buffer | Uint8Array | string): WorkBook {
    return this.workbookReader(input);
  }
}
