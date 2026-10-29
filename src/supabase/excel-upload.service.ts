import { supabase } from './config';
import type { ExcelUpload } from '../types/supabase-extended';

const TABLE = 'excel_uploads';

export const excelUploadService = {
  async createRecord(fileName: string, total: number, success: number, errorRows: number, user?: string): Promise<string> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([
        {
          file_name: fileName,
          total_rows: total,
          success_rows: success,
          error_rows: errorRows,
          uploaded_by: user || 'admin',
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async getAll(): Promise<ExcelUpload[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};