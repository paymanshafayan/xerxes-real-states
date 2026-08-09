"use client";

import { useState } from "react";
import { Calculator, X } from "lucide-react";

interface MortgageCalculatorProps {
  propertyPrice: number;
  currency: string;
}

export default function MortgageCalculator({
  propertyPrice,
  currency,
}: MortgageCalculatorProps) {
  const [downPayment, setDownPayment] = useState(30);
  const [interestRate, setInterestRate] = useState(5.5);
  const [loanTerm, setLoanTerm] = useState(20);
  const [isOpen, setIsOpen] = useState(false);

  const downPaymentAmount = (propertyPrice * downPayment) / 100;
  const loanAmount = propertyPrice - downPaymentAmount;
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;

  const monthlyPayment =
    monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
      : loanAmount / numberOfPayments;

  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - loanAmount;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calculator className="w-4 h-4" />
        Mortgage Calculator
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Mortgage Calculator
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Down Payment */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Down Payment ({downPayment}%)
          </label>
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-sm text-gray-500 mt-1">
            £{downPaymentAmount.toLocaleString()}
          </p>
        </div>

        {/* Interest Rate */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Interest Rate ({interestRate}%)
          </label>
          <input
            type="range"
            min="1"
            max="15"
            step="0.25"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Loan Term */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Loan Term ({loanTerm} years)
          </label>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Results */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
            <p className="text-2xl font-bold text-primary">
              £{Math.round(monthlyPayment).toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Loan Amount</p>
              <p className="font-semibold">
                £{Math.round(loanAmount).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total Interest</p>
              <p className="font-semibold">
                £{Math.round(totalInterest).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Payment</span>
              <span className="font-semibold">
                £{Math.round(totalPayment).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
