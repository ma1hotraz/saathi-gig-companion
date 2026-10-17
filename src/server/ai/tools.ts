import type { FunctionDecl } from './client.js';

const str = (description: string) => ({ type: 'string', description });

/**
 * Functions the chat model can "call". They only describe an intent: the server never acts on
 * them. The browser shows an action card that opens the matching screen, prefilled.
 */
export const CHAT_FUNCTIONS: readonly FunctionDecl[] = [
  {
    name: 'log_earning',
    description: 'Open the earnings logger when the worker wants to record money earned or spent.',
    parameters: {
      type: 'object',
      properties: {
        platform: str('Platform name, e.g. Swiggy'),
        amount: { type: 'number', description: 'Money earned in rupees' },
      },
    },
  },
  {
    name: 'draft_grievance',
    description: 'Open the complaint letter writer when the worker wants to complain about unpaid money, deactivation, unfair deductions or harassment.',
    parameters: {
      type: 'object',
      properties: {
        counterparty: str('Company or employer name'),
        issue_type: {
          type: 'string',
          enum: ['unpaid_wages', 'unfair_deactivation', 'wrong_deduction', 'payment_delay', 'accident_no_support', 'harassment', 'unsafe_conditions', 'other'],
        },
      },
      required: ['counterparty'],
    },
  },
  {
    name: 'find_schemes',
    description: 'Open the welfare scheme finder when the worker asks about government schemes, insurance, pension or benefits.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'explain_document',
    description: 'Open the document helper when the worker wants to understand a notice, contract or paper.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'safety_help',
    description: 'Open the safety coach for a specific risky situation.',
    parameters: {
      type: 'object',
      properties: {
        situation: {
          type: 'string',
          enum: ['night_shift', 'heat', 'rain_flood', 'accident', 'harassment', 'online_fraud', 'vehicle_breakdown', 'customer_conflict'],
        },
      },
    },
  },
];
