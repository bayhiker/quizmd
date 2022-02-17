// All contents inside unescaped double brackets are considered variables
// or statements with variables.
//
// Only the following types of variables are supported
// - int, for example {{10}} is an integer with value 10
// - float, for example {{0.1}} is a float number with value 0.1
// - All other strings are considered names and will be replaced with another name,
//   for example {{Mary}} may be replaced with Alice, Elaine, etc.

import { getRandomName } from "../util/names";

export enum VariableType {
  int,
  float,
  name,
}
export type QuizMdVariables = { [defaultValueString: string]: QuizMdVariable };

export class QuizMdVariable {
  // Raw variable content between double curly brackets
  variable: string;
  // Variable type deduced from variable string
  variableType: VariableType = VariableType.name;
  // Default value deduced from variable string
  defaultValue: any;
  randomValue: any;

  constructor(variable: string) {
    this.variable = variable;
    if (/^-?\d+$/.test(variable)) {
      this.variableType = VariableType.int;
      this.defaultValue = parseInt(variable);
    } else if (/^-?\d+\.\d+$/.test(variable)) {
      this.variableType = VariableType.float;
      this.defaultValue = parseFloat(variable);
    } else {
      this.defaultValue = variable;
    }
    this.resetRandomValue();
  }

  static fromDefaultValue(defaultValue: string) {
    return new QuizMdVariable(defaultValue);
  }

  resetRandomValue(): void {
    if (
      this.variableType === VariableType.int ||
      this.variableType === VariableType.float
    ) {
      // Generate a random int between half and double defaultValue
      let lowerBound = 0,
        upperBound = 0;
      if (this.defaultValue > 100) {
        lowerBound = Math.floor(this.defaultValue / 2);
        upperBound = Math.ceil(this.defaultValue * 2);
      } else if (this.defaultValue > 0) {
        lowerBound = 0;
        upperBound = this.defaultValue * 2;
      } else if (this.defaultValue === 0) {
        lowerBound = -50;
        upperBound = 50;
      } else if (this.defaultValue > -100) {
        lowerBound = this.defaultValue * 2;
        upperBound = 0;
      } else {
        lowerBound = Math.floor(this.defaultValue * 2);
        upperBound = Math.ceil(this.defaultValue / 2);
      }
      if (this.variableType === VariableType.int) {
        this.randomValue = Math.floor(
          lowerBound + Math.random() * (upperBound - lowerBound)
        );
      } else {
        // Find number of digits after the single dot in defaultValue
        const decimalDigits =
          this.variable.length - 1 - this.variable.indexOf(".");
        const randomValue =
          lowerBound + Math.random() * (upperBound - lowerBound);
        // Trim to the same number of decimal digits
        const expDecimalDigits = Math.pow(10, decimalDigits);
        this.randomValue =
          Math.floor(randomValue * expDecimalDigits) / expDecimalDigits;
      }
    } else {
      // generate new name
      this.randomValue = getRandomName(this.variable);
    }
  }
}
