
const lock=document.getElementById("lock");
const pass=document.getElementById("password");
const win=document.getElementById("window");
const face=document.getElementById("faceid");

pass.addEventListener("input",()=>{
    lock.classList.toggle("active",pass.value.length>0);
});

document.addEventListener("keydown",e=>{
    if(e.key==="Enter")login();
});

if(localStorage.user){
    username.value=localStorage.user;
    remember.checked=true;
}

function togglePass(){
    pass.type = pass.type === "password" ? "text" : "password";
}

function login(){
    error.textContent="";
    if(username.value==="admin" && pass.value==="12345678"){
        if(remember.checked){
            localStorage.user=username.value;
        }else{
            localStorage.removeItem("user");
        }
        okSound.play();
        face.style.display="flex";
        setTimeout(()=>location.href="index.html",1200);
    }else{
        errSound.play();
        error.textContent="Invalid username or password.";
        win.style.animation="shake .35s";
        setTimeout(()=>win.style.animation="",350);
    }
}

function cancel(){
    username.value="";
    password.value="";
    error.textContent="";
    lock.classList.remove("active");
}
