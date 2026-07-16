export interface WorksheetDefinition {
  readonly logicalName: string;
  readonly sheetNames: string[];
}

export interface LoadedWorksheets {
  readonly registrationOrders?: string;
  readonly currencyAllocation?: string;
  readonly originRegistration?: string;
  readonly customsDeclaration?: string;
  readonly commitmentSettlement?: string;
}

export class WorksheetLoader {
  constructor(
    private readonly worksheetDefinitions: readonly WorksheetDefinition[] = [
      {
        logicalName: 'Registration Orders',
        sheetNames: ['Registration Orders', 'RegistrationOrder', 'registration orders', 'registration-order'],
      },
      {
        logicalName: 'Currency Allocation',
        sheetNames: ['Currency Allocation', 'Currency Request', 'currency allocation', 'currency-request'],
      },
      {
        logicalName: 'Origin Registration',
        sheetNames: ['Origin Registration', 'Origin', 'origin registration', 'origin-registration'],
      },
      {
        logicalName: 'Customs Declaration',
        sheetNames: ['Customs Declaration', 'Customs', 'customs declaration', 'customs-declaration'],
      },
      {
        logicalName: 'Commitment Settlement',
        sheetNames: ['Commitment Settlement', 'Commitment', 'commitment settlement', 'commitment-settlement'],
      },
    ],
  ) {}

  public loadWorksheets(sheetNames: readonly string[]): LoadedWorksheets {
    const normalizedSheetNames = sheetNames.map((name) => name.trim());

    return {
      registrationOrders: this.findWorksheetName(normalizedSheetNames, 'Registration Orders'),
      currencyAllocation: this.findWorksheetName(normalizedSheetNames, 'Currency Allocation'),
      originRegistration: this.findWorksheetName(normalizedSheetNames, 'Origin Registration'),
      customsDeclaration: this.findWorksheetName(normalizedSheetNames, 'Customs Declaration'),
      commitmentSettlement: this.findWorksheetName(normalizedSheetNames, 'Commitment Settlement'),
    };
  }

  private findWorksheetName(sheetNames: readonly string[], logicalName: string): string | undefined {
    const definition = this.worksheetDefinitions.find((candidate) => candidate.logicalName === logicalName);

    if (!definition) {
      return undefined;
    }

    const matchingName = definition.sheetNames.find((candidate) =>
      sheetNames.some((sheetName) => sheetName.toLowerCase() === candidate.toLowerCase()),
    );

    return matchingName;
  }
}
