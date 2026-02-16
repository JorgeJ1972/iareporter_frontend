export interface Report{
    id:number;
    owner:number;
    name:string;
    prompt:string;
    query:string;
    tables_group_id:number;
    is_public:boolean;
    date_created: Date;
    date_lastupdated: Date;
    is_enabled:boolean;
}

export interface ReportUpdate{
    name:string;
    tables_group_id:number;
    prompt:string;
    query:string;
    is_public:boolean;
    is_enabled:boolean;
}

export interface ReportCreate{
    name:string;
    tables_group_id:number;
    prompt:string;
    query:string;
    is_public:boolean;
    is_enabled:boolean;
    owner:number;
}

export interface ReportParam {
    id:number
    report_id:number;
    name:string;
    type_id:number;
    enabled:boolean;
    values:Array<string>;
    type_element:string;
    prompt_part:string;
}

export interface ReportParamValueExtended extends ReportParam {
    text_prompt:string;
}


export interface ReportParamValue {
    id:number;
    index: number;
    type_id:number;
    value:string;
}

export interface ReportParamResponse {
    id:number;
    name: string;
    param_type_id:number;
    report_id:number;
    is_enabled:boolean;
    values:string;
}

export interface ParamRun {
    id : number;
    name : string;
    type_id: number;
    value: string;
    possible_values: string;
}

export interface RunReport {
    id: number;
    tables_group_id: number;
    name: string;
    prompt: string;
    query: string;
    params: Array<ParamRun>;
}

export interface ReportColumn {
    name: string;
    alias: string;
    type: string;
    values: Array<string>;
    selected: boolean;
    graphic_selected: boolean;
    graphic_type: string;
}
export interface DataFrame {
    index: string;
    data: string;
}
export interface Attach{
    type:string;
    name:string;
    icono:string;
    path:string
}   

export interface RunReportResponse {
    id: number;
    tables_group_id: number;
    name: string;
    prompt: string;
    query: string;
    dataframe:DataFrame;
    totals: number;
    attachs: Array<Attach>; 
}

export interface ReportParamType {
    id: number;
    name: string;
}

export interface ReportParamCreate {
    name: string;
    param_type_id: number;
    is_enabled: boolean;
    values: string;
}

export interface ReportParamUpdate {
    name: string;
    param_type_id: number;
    is_enabled: boolean;
    values: string;
}

export interface ReportParamDB {
    id:number
    report_id:number;
    name:string;
    param_type_id:number;
    is_enabled:boolean;
    values:string;
}
