import FormPartLibrary from "../../src/formteile/FormPartLibrary.js";

const out=document.getElementById("out");
const lines=[];

function log(text=""){
    lines.push(text);
    out.textContent=lines.join("\n");
}

function ok(name){
    log("✔ "+name);
}

function fail(name){
    throw new Error(name);
}

function run(){

    log("Starte FormPartLibrary Referenztest...");
    log("");

    const lib=new FormPartLibrary();

    const all=lib.getAll();

    if(all.length<10)
        fail("Zu wenige Formteile.");

    ok("Formteile geladen: "+all.length);

    const categories=lib.getCategories();

    ok("Kategorien:");

    categories.forEach(c=>log("   • "+c));

    log("");

    const bogen=lib.search("Bogen");

    if(bogen.length===0)
        fail("Suche Bogen");

    ok("Suche Bogen");

    const rund=lib.getByCategory("Rundrohr");

    if(rund.length===0)
        fail("Kategorie Rundrohr");

    ok("Kategorie Rundrohr");

    const item=lib.getById("kreis_bogen_kruemmer");

    if(!item)
        fail("ID Suche");

    ok(item.name);

    log("");

    log("Bibliothek enthält:");

    all.forEach(part=>{

        log(
            "• "+
            part.category+
            "  |  "+
            part.name
        );

    });

    log("");
    log("✅ FORMPARTLIBRARY TEST BESTANDEN");

}

try{

    run();

}
catch(e){

    log("");
    log("❌ TEST ABGEBROCHEN");
    log(e);

}