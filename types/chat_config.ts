export interface ChatConfig{
    user_name:string;
    table_export:string;
    graphic_export:string;
    language:string;
    colors:string;
    include_voice:boolean;
    created_at?: Date | null;
    updated_at?: Date | null;
}