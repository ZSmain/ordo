import { insertCategorySchema, selectCategorySchema } from './server/db/schema';
import type { InsertCategory, SelectCategory } from './types';
import * as v from 'valibot';

/**
 * Validates category data for insertion
 * @param data - The category data to validate
 * @returns Parsed and validated category data
 * @throws {ValiError} If validation fails
 */
export function validateInsertCategory(data: unknown): InsertCategory {
	return v.parse(insertCategorySchema, data);
}

/**
 * Validates category data from selection
 * @param data - The category data to validate
 * @returns Parsed and validated category data
 * @throws {ValiError} If validation fails
 */
export function validateSelectCategory(data: unknown): SelectCategory {
	return v.parse(selectCategorySchema, data);
}

/**
 * Safely validates category data for insertion
 * @param data - The category data to validate
 * @returns Object with success status and either data or error
 */
export function safeValidateInsertCategory(
	data: unknown
): { success: true; data: InsertCategory } | { success: false; error: string } {
	const result = v.safeParse(insertCategorySchema, data);
	if (result.success) {
		return { success: true, data: result.output };
	}
	return {
		success: false,
		error: v.flatten(result.issues).nested
			? Object.entries(v.flatten(result.issues).nested!)
					.map(([key, msgs]) => `${key}: ${msgs?.join(', ')}`)
					.join(', ')
			: v.flatten(result.issues).root?.join(', ') || 'Validation failed'
	};
}

/**
 * Safely validates category data from selection
 * @param data - The category data to validate
 * @returns Object with success status and either data or error
 */
export function safeValidateSelectCategory(
	data: unknown
): { success: true; data: SelectCategory } | { success: false; error: string } {
	const result = v.safeParse(selectCategorySchema, data);
	if (result.success) {
		return { success: true, data: result.output };
	}
	return {
		success: false,
		error: v.flatten(result.issues).nested
			? Object.entries(v.flatten(result.issues).nested!)
					.map(([key, msgs]) => `${key}: ${msgs?.join(', ')}`)
					.join(', ')
			: v.flatten(result.issues).root?.join(', ') || 'Validation failed'
	};
}
