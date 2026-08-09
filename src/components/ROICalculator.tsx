"use client";

import { useState } from "react";
import { TrendingUp, X } from "lucide-react";

interface ROICalculatorProps {
  propertyPrice: number;
  currency: string;
}

export default function ROICalculator({
  propertyPrice,
  currency,
}: ROICalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [annualExpenses, setAnnualExpenses] = useState("");
  const [holdingYears, setHoldingYears] = useState(5);
  const [appreciationRate, setAppreciationRate] = useState(3);

  const monthlyRentNum = Number(monthlyRent) || 0;
  const annualExpensesNum = Number(annualExpenses) || 0;
  const annualRent = monthlyRentNum * 12;
  const annualNetRent = annualRent - annualExpensesNum;

  const grossYield = propertyPrice > 0 ? ((annualRent / propertyPrice) * 100) : 0;
  const netYield = propertyPrice > 0 ? ((annualNetRent / propertyPrice) * 100) : 0;

  const futureValue = propertyPrice * Math.pow(1 + appreciationRate / 100, holdingYears);
  const totalRentIncome = annualNetRent * holdingYears;
  const totalProfit = (futureValue - propertyPrice) + totalRentIncome;
  const totalROI = propertyPrice > 0 ? ((totalProfit / propertyPrice) * 100) : 0;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <TrendingUp className="w-4 h-4" />
        ROI Calculator
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          ROI Calculator
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Monthly Rent */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Monthly Rent (£)
          </label>
          <input
            type="number"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            placeholder="e.g., 800"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        {/* Annual Expenses */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Annual Expenses (£)
          </label>
          <input
            type="number"
            value={annualExpenses}
            onChange={(e) => setAnnualExpenses(e.target.value)}
            placeholder="e.g., 2000"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-gray-400 mt-1">
            Maintenance, tax, insurance, management fees
          </p>
        </div>

        {/* Holding Period */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Holding Period ({holdingYears} years)
          </label>
          <input
            type="range"
            min="1"
            max="30"
            value={holdingYears}
            onChange={(e) => setHoldingYears(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Appreciation Rate */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Annual Appreciation ({appreciationRate}%)
          </label>
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={appreciationRate}
            onChange={(e) => setAppreciationRate(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Results */}
        {monthlyRentNum > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-500">Gross Yield</p>
                <p className="text-xl font-bold text-primary">{grossYield.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Net Yield</p>
                <p className="text-xl font-bold text-success">{netYield.toFixed(1)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Future Value</p>
                <p className="font-semibold">
                  £{Math.round(futureValue).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total Profit</p>
                <p className="font-semibold text-success">
                  £{Math.round(totalProfit).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total ROI</span>
                <span className="font-bold text-primary">
                  {totalROI.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
