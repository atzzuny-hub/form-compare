import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { BRANCH_LIST, REGION_LIST } from "./constants";
import { useState } from "react";
import { HtmlContext } from "next/dist/server/route-modules/pages/vendored/contexts/entrypoints";


export function StateForm(){
    
    return( 
        <div>
            <FormControl fullWidth>
                <InputLabel id="region">지역</InputLabel>
                <Select
                    labelId="region"
                    label="지역"
                    size="small"
                    value={''}
                    onChange={()=>{}}
                >
                    {REGION_LIST.map((option) => (
                        <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                    ))}
                    
                </Select>
            </FormControl>
            <FormControl fullWidth>
                <InputLabel id="region">지점</InputLabel>
                <Select
                    labelId="region"
                    id="region"
                    size="small"
                    sx={{alignItems:'center'}}
                    value={''}
                    label="Age"
                    onChange={()=>{}}
                >
                    {/* {brandhOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                    ))} */}
                    
                </Select>
            </FormControl>
        </div>
    )
}