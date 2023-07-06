



const f1 = () => {
    console.log("zaczynam f1");
    let i = 0;
    let wynik;
    for (i=0; i<1000000000; i++ ) {
        wynik = Math.sqrt(i);
    }
    console.log("skończyłem f1, i=",i);
}

const f2 = ()=>console.log("skonczyłem F2....");


f1();
f2();
