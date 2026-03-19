const pages=document.querySelectorAll(".page");
function switchPage(id){
    pages.forEach(p=>p.classList.remove("active"));
    document.getElementById(id+"Page").classList.add("active");
    if(id==="trash"){
        renderTrash();
    }
}
switchPage("today");

/* 时间 */
function updateTime(){
    const now=new Date();
    document.getElementById("date").innerText=
        `${now.getMonth()+1}月${now.getDate()}日 ${now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})}`;
}
setInterval(updateTime,1000); updateTime();

/* 数据 */
let tasks=JSON.parse(localStorage.getItem("tasks"))||[];
let trash=JSON.parse(localStorage.getItem("trash"))||[];

const list=document.getElementById("taskList");
const input=document.getElementById("taskInput");

input.addEventListener("keypress",e=>{
    if(e.key==="Enter" && input.value.trim()){
        tasks.unshift({text:input.value,date:new Date().toDateString(),done:false});
        input.value="";
        save(); renderTasks();
    }
});

function renderTasks(){
    list.innerHTML="";
    const sorted=[...tasks.filter(t=>!t.done),...tasks.filter(t=>t.done)];
    sorted.forEach((task, index)=>{
        const li=document.createElement("li");
        li.className="task"+(task.done?" done":"" );

        const batchCheckbox=document.createElement("input");
        batchCheckbox.type="checkbox";
        batchCheckbox.className="batch-checkbox";
        batchCheckbox.onchange=updateBatchActions;

        const span=document.createElement("span");
        span.innerHTML=`<input type="checkbox" ${task.done?"checked":""}> ${task.text}`;

        span.querySelector("input").onchange=()=>{
            task.done=!task.done;
            save(); renderTasks();
        };

        const deleteBtn=document.createElement("button");
        deleteBtn.className="delete-btn";
        deleteBtn.innerHTML="<i class="ri-delete-bin-line"></i>";
        deleteBtn.onclick=()=>deleteTask(index);

        li.appendChild(batchCheckbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
    
    document.getElementById("selectAll").onchange=function(){
        const checkboxes=document.querySelectorAll(".batch-checkbox");
        checkboxes.forEach(cb=>cb.checked=this.checked);
        updateBatchActions();
    };
    
    document.getElementById("batchDelete").onclick=batchDelete;
    
    updateBatchActions();
    renderCompleted();
    renderCalendar();
}

function updateBatchActions(){
    const checkboxes=document.querySelectorAll(".batch-checkbox:checked");
    const batchActions=document.getElementById("batchActions");
    batchActions.style.display=checkboxes.length>0?"block":"none";
}

function batchDelete(){
    const checkboxes=document.querySelectorAll(".batch-checkbox");
    const sorted=[...tasks.filter(t=>!t.done),...tasks.filter(t=>t.done)];
    const tasksToDelete=[];
    
    checkboxes.forEach((cb, index)=>{
        if(cb.checked){
            tasksToDelete.push(sorted[index]);
        }
    });
    
    if(tasksToDelete.length>0){
        tasksToDelete.forEach(task=>{
            trash.unshift({...task, deletedAt: new Date().toDateString()});
        });
        
        tasks=tasks.filter(t=>!tasksToDelete.includes(t));
        save();
        renderTasks();
        renderTrash();
    }
}
renderTasks();

/* 已完成 */
function renderCompleted(){
    const page=document.getElementById("completedPage");
    page.innerHTML="";
    tasks.filter(t=>t.done).forEach(t=>{
        const div=document.createElement("div");
        div.className="completedCard";
        div.innerHTML=`✔ ${t.text}`;
        page.appendChild(div);
    });
}

/* 日历 */
function renderCalendar(){
    const page=document.getElementById("calendarPage");
    page.innerHTML="";
    const now=new Date();
    const first=new Date(now.getFullYear(),now.getMonth(),1).getDay();
    const days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();

    const grid=document.createElement("div");
    grid.className="calendarGrid";

    ["日","一","二","三","四","五","六"].forEach(d=>{
        const h=document.createElement("div");
        h.innerHTML="<b>"+d+"</b>";
        grid.appendChild(h);
    });

    for(let i=0;i<first;i++) grid.appendChild(document.createElement("div"));

    for(let i=1;i<=days;i++){
        const cell=document.createElement("div");
        cell.className="dayCell";
        if(i===now.getDate()) cell.classList.add("today");

        const dateStr=new Date(now.getFullYear(),now.getMonth(),i).toDateString();
        const dayTasks=tasks.filter(t=>t.date===dateStr);

        cell.innerHTML=`<strong>${i}</strong>`;
        dayTasks.forEach(t=>{
            const d=document.createElement("div");
            d.textContent="• "+t.text;
            cell.appendChild(d);
        });

        grid.appendChild(cell);
    }

    page.appendChild(grid);
}

/* 迷你日历 */
function miniCalendar(){
    const container=document.getElementById("miniCalendar");
    const month=document.getElementById("miniMonth");
    const now=new Date();

    month.innerText=`${now.getMonth()+1}月`;

    const header=document.createElement("div");
    header.className="miniHeader";
    ["周日","周一","周二","周三","周四","周五","周六"].forEach(d=>{
        header.innerHTML+=`<div>${d}</div>`;
    });

    const grid=document.createElement("div");
    grid.className="miniGrid";

    const first=new Date(now.getFullYear(),now.getMonth(),1).getDay();
    const days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();

    for(let i=0;i<first;i++) grid.innerHTML+="<div></div>";

    for(let i=1;i<=days;i++){
        const span=document.createElement("div");
        span.textContent=i;
        if(i===now.getDate()) span.classList.add("circle");
        grid.appendChild(span);
    }

    container.appendChild(header);
    container.appendChild(grid);
}
miniCalendar();

/* 主题 */
const toggle=document.getElementById("themeToggle");
toggle.onclick=()=>{
    document.body.classList.toggle("dark");
    toggle.innerText=document.body.classList.contains("dark")?"☀️":"🌙";
};

function deleteTask(index){
    const sorted=[...tasks.filter(t=>!t.done),...tasks.filter(t=>t.done)];
    const taskToDelete=sorted[index];
    trash.unshift({...taskToDelete, deletedAt: new Date().toDateString()});
    tasks=tasks.filter(t=>t!==taskToDelete);
    save();
    renderTasks();
    renderTrash();
}

function renderTrash(){
    const page=document.getElementById("trashPage");
    page.innerHTML="";
    
    if(trash.length===0){
        page.innerHTML="<div class='empty-trash'>垃圾桶是空的</div>";
        return;
    }
    
    const header=document.createElement("div");
    header.className="trash-header";
    header.innerHTML=`
        <h3>已删除的任务 (${trash.length})</h3>
        <button onclick="emptyTrash()" class="empty-btn">清空垃圾桶</button>
    `;
    page.appendChild(header);
    
    trash.forEach((task, index)=>{
        const div=document.createElement("div");
        div.className="trash-item";
        div.innerHTML=`
            <div>
                <span>${task.text}</span>
                <small>删除于：${task.deletedAt}</small>
            </div>
            <div class="trash-actions">
                <button onclick="restoreTask(${index})" class="restore-btn">恢复</button>
                <button onclick="permanentDelete(${index})" class="permanent-btn">彻底删除</button>
            </div>
        `;
        page.appendChild(div);
    });
}

function restoreTask(index){
    const taskToRestore=trash[index];
    tasks.unshift({...taskToRestore});
    trash.splice(index, 1);
    save();
    renderTasks();
    renderTrash();
}

function permanentDelete(index){
    trash.splice(index, 1);
    save();
    renderTrash();
}

function emptyTrash(){
    if(confirm("确定要清空垃圾桶吗？")){
        trash=[];
        save();
        renderTrash();
    }
}

function save(){
    localStorage.setItem("tasks",JSON.stringify(tasks));
    localStorage.setItem("trash",JSON.stringify(trash));
}