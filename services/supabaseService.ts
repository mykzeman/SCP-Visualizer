import { SupabaseClient } from '@supabase/supabase-js';
import type { ScpData } from '../types';

export const saveScpData = async (
    supabase: SupabaseClient,
    scpDataList: ScpData[],
    tableName: string,
    columnMapping: Record<string, string>
): Promise<void> => {
    if (scpDataList.length === 0) {
        return;
    }

    const payloads = scpDataList.map(scpData => {
        const payload: { [key: string]: any } = {};
        for (const [dataKey, dbColumn] of Object.entries(columnMapping)) {
            if (Object.prototype.hasOwnProperty.call(scpData, dataKey)) {
                payload[dbColumn] = scpData[dataKey as keyof ScpData];
            }
        }
        return payload;
    }).filter(p => Object.keys(p).length > 0);


    if (payloads.length === 0) {
        throw new Error("Could not map SCP data to any table columns. Please check your table schema.");
    }

    const { error } = await supabase.from(tableName).insert(payloads);

    if (error) {
        console.error('Supabase batch insert error:', error);
        throw new Error(`Supabase error: ${error.message}`);
    }
};

export const checkIfScpsExist = async (
    supabase: SupabaseClient,
    tableName: string,
    nameColumn: string,
    scpNames: string[]
): Promise<Set<string>> => {
    if (scpNames.length === 0 || !nameColumn) {
        return new Set();
    }

    const { data, error } = await supabase
        .from(tableName)
        .select(nameColumn)
        .in(nameColumn, scpNames);

    if (error) {
        console.error('Supabase checkIfExists error:', error);
        // Don't throw, just return an empty set so the app can proceed
        return new Set();
    }

    const existingNames = new Set<string>();
    if (data) {
        for (const item of data) {
            if (item[nameColumn]) {
                existingNames.add(item[nameColumn]);
            }
        }
    }
    
    return existingNames;
};