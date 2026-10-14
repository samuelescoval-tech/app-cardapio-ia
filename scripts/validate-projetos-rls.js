// Executa a migracao real em PostgreSQL WASM descartavel. Nunca usa Supabase.
// Dependencia de teste externa ao app: KARAMU_TEST_PG_DIR=/tmp/karamu-db-test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(require.resolve('@electric-sql/pglite', {paths:[process.env.KARAMU_TEST_PG_DIR || process.cwd()]}));
const { randomUUID } = require('node:crypto');

async function main() {
  const db = await PGlite.create();
  try {
    await db.exec(`create role authenticated; create role anon; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to authenticated,anon;`);
    const sql = fs.readFileSync(path.join(__dirname,'../supabase/migrations/008_projetos.sql'),'utf8');
    await db.exec(sql); await db.exec(sql); // reaplicacao nao duplica politicas
    const A=randomUUID(), B=randomUUID(), id=randomUUID();
    await db.query('insert into auth.users values ($1),($2)',[A,B]);
    const papel = async (role, dono='') => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[dono]);
      await db.exec('set role '+role);
    };
    const dados=[A,id,JSON.stringify({tipo:'Evento A',pessoas:10}),JSON.stringify({cardapio:[{nome:'Prato A'}],receitas:[{nome:'Receita A'}]})];
    const inserir=`insert into public.projetos(user_id,id,versao,tipo,pessoas,resumo,evento,plano)
      values($1,$2,1,'Evento A',10,'Privado',$3::jsonb,$4::jsonb)`;
    await papel('anon');
    await assert.rejects(db.query('select * from public.projetos'),e=>e.code==='42501');
    await assert.rejects(db.query(inserir,dados),e=>e.code==='42501');
    await papel('authenticated',A);
    await db.query(inserir,dados);
    const antes=(await db.query('select created_at from public.projetos')).rows[0].created_at;
    await db.query(inserir+' on conflict(user_id,id) do update set plano=excluded.plano',dados);
    assert.equal((await db.query('select * from public.projetos')).rows.length,1);
    assert.deepEqual((await db.query('select created_at from public.projetos')).rows[0].created_at,antes);
    await papel('authenticated',B);
    assert.equal((await db.query('select * from public.projetos')).rows.length,0);
    assert.equal((await db.query('update public.projetos set resumo=\'Outro\' where id=$1 returning id',[id])).rows.length,0);
    assert.equal((await db.query('delete from public.projetos where id=$1 returning id',[id])).rows.length,0);
    await assert.rejects(db.query(inserir,dados),e=>e.code==='42501');
    // Mesmo UUID em outra conta e um projeto diferente, nao sobrescreve A.
    await db.query(inserir,[B,...dados.slice(1)]);
    assert.equal((await db.query('select user_id from public.projetos')).rows[0].user_id,B);
    await papel('authenticated',A);
    await assert.rejects(db.query('update public.projetos set user_id=$1 where id=$2',[B,id]),e=>e.code==='42501');
    assert.equal((await db.query('select plano from public.projetos')).rows[0].plano.receitas[0].nome,'Receita A');
    await db.query('delete from public.projetos where id=$1',[id]);
    assert.equal((await db.query('select * from public.projetos')).rows.length,0);
    await papel('authenticated',B);
    assert.equal((await db.query('select * from public.projetos')).rows.length,1);
    await papel('postgres');
    await db.query('delete from auth.users where id=$1',[B]);
    assert.equal((await db.query('select * from public.projetos')).rows.length,0);
    console.log('PASS: migracao reaplicavel; anon bloqueado; dono salva/carrega; retry nao duplica; outra conta nao le/edita/exclui/atribui dono; UUID igual isolado; exclusao de conta em cascata.');
  } finally { await db.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
