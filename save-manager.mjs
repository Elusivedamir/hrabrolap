import {CURRENT_SAVE_KEY,LEGACY_SAVE_KEY,MAX_BACKUP_BYTES,makeBackup,parseBackup} from './save-backup.mjs';
const $=id=>document.getElementById(id);
let selected=null;
const raw=()=>localStorage.getItem(CURRENT_SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY);
const status=message=>{$('status').textContent=message;};
function loadCurrent(){
 let saved=raw();if(!saved){$('source').textContent='На этом адресе прогресс пока не найден.';return;}
 try{
  const p=JSON.parse(saved);
  $('source').textContent='Найден прогресс: волна '+(p.best||0)+', золото '+(p.gold||0)+'.';
  $('export').disabled=false;
 }catch(e){$('source').textContent='Сохранение повреждено. Не очищай его: попробуй сохранить исходные данные.';status('Ошибка чтения сохранения: '+e.message);}
}
$('export').addEventListener('click',()=>{
 try{
  const backup=makeBackup(JSON.parse(raw()));
  const url=URL.createObjectURL(new Blob([backup],{type:'application/json;charset=utf-8'}));
  const a=document.createElement('a');const p=JSON.parse(raw());a.href=url;
  a.download='hrabrolap-save-wave-'+Math.max(0,Number(p.best)||0)+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Резервная копия скачана. Открой страницу сохранений на новом порту и загрузи этот файл.');
 }catch(e){status('Не удалось создать копию: '+e.message);}
});
$('file').addEventListener('change',async()=>{
 selected=null;$('import').disabled=true;
 const file=$('file').files?.[0];
 if(!file){$('preview').textContent='Файл не выбран';return;}
 if(file.size>MAX_BACKUP_BYTES){$('preview').textContent='Файл слишком большой';return;}
 try{
  const result=parseBackup(await file.text());selected=result;
  const x=result.summary;
  $('preview').textContent='Волна: '+x.best+' из 2000, текущая: '+x.room+', золото: '+x.gold+'; мечей: '+x.ownedWeapons+', брони: '+x.ownedArmors+', трофеев боссов: '+x.megaBossWins+'.';
  $('import').disabled=false;
  status('Данные проверены, но ещё НЕ восстановлены. Чтобы продолжить, нажми кнопку восстановления.');
 }catch(e){$('preview').textContent='Файл не подходит: '+e.message;status('Текущее сохранение не изменено.');}
});
$('import').addEventListener('click',()=>{
 if(!selected)return;
 const old=raw();
 if(!confirm('Заменить сохранение на ТЕКУЩЕМ адресе? Сначала скачай его резервную копию.'))return;
 try{
  // localStorage.setItem is synchronous and atomic for the individual key.
  localStorage.setItem(CURRENT_SAVE_KEY,selected.json);
  $('preview').textContent='Готово. Восстановлена волна '+selected.summary.room+' (пройдено '+selected.summary.best+').';
  $('import').disabled=true;selected=null;
  status('Прогресс восстановлен. Вернись в игру или обнови её страницу.');
  loadCurrent();
 }catch(e){
  if(old!==null){try{localStorage.setItem(CURRENT_SAVE_KEY,old);}catch{}}
  status('Ошибка восстановления, исходное сохранение не удалено: '+e.message);
 }
});
loadCurrent();
