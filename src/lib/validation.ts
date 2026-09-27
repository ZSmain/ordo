import { insertCategorySchema, selectCategorySchema } from './server/db/schema';
import type { InsertCategory, SelectCategory } from './types';
import * as v from 'valibot';

export function validateInsertCategory(data: unknown): InsertCategory {
	return v.parse(insertCategorySchema, data);
}

export function validateSelectCategory(data: unknown): SelectCategory {
	return v.parse(selectCategorySchema, data);
}

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
