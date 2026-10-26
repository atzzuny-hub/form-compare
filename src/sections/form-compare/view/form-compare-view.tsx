'use client'

import {Container, Card, Typography, Stack, FormControlLabel, Switch, Button, Dialog, DialogTitle, Box, DialogActions, DialogContent} from "@mui/material";
import { useState } from "react"
import { StateForm } from "../state-form";

export function FormCompareView(){

    const [open, setOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return(
        <Container sx={{ py: 5 }}>
            <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>식당 예약 모달 예제</Typography>
            
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center'}}>
                    <FormControlLabel
                        label="관리자모드"
                        control={
                            <Switch 
                                checked={isAdmin} 
                                onChange={(e)=> setIsAdmin(e.target.checked)}
                            />
                        }
                    />
                    <Button variant="contained" onClick={handleOpen}>
                        열기
                    </Button>
                </Stack>
            </Card>

            <Dialog fullWidth maxWidth="xl" open={open} onClose={handleClose}>
                <DialogTitle>식당 예약 {isAdmin && '(관리자)'}</DialogTitle>

                <DialogContent dividers>
                    <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
                        <Typography variant="h6">zod + Field.*</Typography>
                        <Typography variant="h6">zod + RHF + MUI 기본</Typography>
                        {/* <Typography variant="h6">useState</Typography> */}
                        <StateForm/>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button variant="outlined" onClick={handleClose}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}