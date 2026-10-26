import { createTheme } from '@mui/material/styles';
import { koKR } from '@mui/material/locale';
import { koKR as pickersKoKR } from '@mui/x-date-pickers/locales';

export const theme = createTheme(
    {
        cssVariables: true, // https://mui.com/material-ui/customization/theming/#css-theme-variables
        typography: { //https://mui.com/material-ui/customization/typography/?_gl=1*tvq47s*_up*MQ..*_ga*ODkyMTQxMTgxLjE3OTMwMDE0NDI.*_ga_5NXDQLC2ZK*czE3OTMwMDE0NDIkbzEkZzAkdDE3OTMwMDE0NDIkajYwJGwwJGgw#font-family
            fontFamily: '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
        },
    },
    koKR,        // MUI 기본 문구 (페이지네이션 등)
    pickersKoKR, // DatePicker 문구 (확인/취소 등)
)