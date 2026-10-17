// Russian count forms, including 11–14 and numbers above twenty.
export function pluralRu(count, one, few, many) {
 const n=Math.abs(count);
 if(!Number.isInteger(n))return few;
 const last=n%10, hundred=n%100;
 if(hundred>=11&&hundred<=14)return many;
 return last===1?one:last>=2&&last<=4?few:many;
}
export const fishCount=n=>`${n} ${pluralRu(n,'рыба','рыбы','рыб')}`;
