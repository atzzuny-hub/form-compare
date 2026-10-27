import { Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { BRANCH_LIST, REGION_LIST } from "./constants";
import { useState } from "react";

type ReservationInfo = {
    regionId: number;
    branchId: number;
}

const EMPTY_RESERVATION: ReservationInfo = {
  regionId: 0,
  branchId: 0,
};




export function StateForm(){

    const [reservationInfo, setReservationInfo] = useState<ReservationInfo>(EMPTY_RESERVATION)
    const [errors, setErrors] = useState<ReservationErrors>({})

    // Select의 onChange는 TextField와 다른 SelectChangeEvent 타입
    const handleChangeRegion = (e: SelectChangeEvent<number>) => {
        setReservationInfo((prev) => ({
            ...prev, 
            regionId: e.target.value,
            branchId: 0  // 지역이 바뀌면 지점 초기화
        }))

        setErrors((prev) => ({...prev, regionId: undefined}))
    }

    // 지점은 선택된 지역에서 계산
    const branchList = BRANCH_LIST.filter((b) => b.regionId === reservationInfo.regionId)

    const handleChangeBranch = (e:SelectChangeEvent<number>) => {
        setReservationInfo((prev) => ({
            ...prev,
            branchId : e.target.value
        }))

        setErrors((prev) => ({...prev, branchId: undefined}))
    }

    type ReservationErrors = Partial<Record<keyof ReservationInfo, string>>

    const validate = (info: ReservationInfo) : ReservationErrors => {
        const newErrors: ReservationErrors = {};

        if(!info.regionId) newErrors.regionId = "지역을 선택하세요.";
        if(!info.branchId) newErrors.branchId = "지점을 선택하세요."

        return newErrors
    }

    const handleSubmit = () => {

        const nextErrors = validate(reservationInfo);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) return; // 에러가 있으면 여기서 멈춤
        console.log('제출', reservationInfo);
    };
    

    
    return( 
        <div>
            <FormControl fullWidth error={!!errors.regionId}>
                <InputLabel id="region">지역</InputLabel>
                <Select
                    labelId="region"
                    label="지역"
                    size="small"
                    value={reservationInfo.regionId}
                    onChange={handleChangeRegion}
                >
                    <MenuItem value={0} divider><em>선택안함</em></MenuItem>
                    {REGION_LIST.map((option) => (
                        <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                    ))}
                </Select>
                <FormHelperText>{errors.regionId}</FormHelperText>
            </FormControl>
            <FormControl fullWidth error={!!errors.branchId}>
                <InputLabel id="branchId">지점</InputLabel>
                <Select
                    labelId="region"
                    id="region"
                    size="small"
                    sx={{alignItems:'center'}}
                    value={reservationInfo.branchId}
                    label="Age"
                    onChange={handleChangeBranch}
                >
                    <MenuItem value={0} divider><em>선택안함</em></MenuItem>
                    {branchList.map((option) => (
                        <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                    ))}                    
                </Select>
                <FormHelperText>{errors.branchId}</FormHelperText>
            </FormControl>

            <Button variant="contained" onClick={handleSubmit}>예약</Button>
        </div>
    )
}