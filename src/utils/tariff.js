/**
 * CPVTS Duration & Tariff Calculation Engine
 * Strictly enforces Codethon Problem Statement Pricing Matrix:
 * 
 * - Staff:
 *     Two-Wheeler  -> ₹0
 *     Four-Wheeler -> ₹0
 * 
 * - Student:
 *     Two-Wheeler  -> First 2 hours free, then ₹10/hour
 *     Four-Wheeler -> First 2 hours free, then ₹20/hour
 * 
 * - Visitor:
 *     Two-Wheeler  -> ₹20/hour
 *     Four-Wheeler -> ₹40/hour
 * 
 * Display elements:
 * - Entry Time
 * - Exit Time
 * - Duration
 * - Free Hours
 * - Charged Hours
 * - Rate
 * - TOTAL AMOUNT
 */

import { computeCodethonFee } from '../services/backendApi';

export function calculateDurationAndFee(
  entryTimeStr,
  exitTime = new Date(),
  category = 'Visitor',
  vehicleType = 'Four-Wheeler'
) {
  const exitFormatted =
    exitTime instanceof Date
      ? exitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : String(exitTime);

  // Invoke authoritative Codethon fee logic
  const res = computeCodethonFee({
    vehicleType,
    category,
    entryTime: entryTimeStr,
    exitTime: exitFormatted
  });

  return {
    entryTime: res.entryTime,
    exitTime: res.exitTime,
    duration: res.duration,
    totalHours: res.totalHours,
    freeHours: res.freeHours,
    chargedHours: res.chargedHours,
    rate: res.rate,
    totalAmount: res.totalAmount,
    fee: res.totalAmount, // alias for legacy bindings
    tariffBreakdown: res.calculationFormula,
    calculationFormula: res.calculationFormula,
    isExempt: res.totalAmount === 0,
    vehicleType: res.vehicleType,
    category: res.category
  };
}
