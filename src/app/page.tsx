import { Metadata } from 'next';
import { FormCompareView } from '@/sections/form-compare/view';

export const metadata : Metadata = { title: '식당 예약'}

export default function Page() {
  return <FormCompareView/>;
}