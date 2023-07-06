'use strict';

let canvas  = document.getElementById('canvas');
let context = canvas.getContext('2d');

canvas.width  = window.innerWidth-30;
canvas.height = window.innerHeight-10;

canvas.style.border = '5px solid red';

let canvas_width = canvas.width;
let canvas_height = canvas.height;

let shapes = [];
let current_shape_index = null;
let is_dragging = false;
let startX;
let startY;
shapes.push({x:200, y:50,  width:200, height:200, color: 'red'});
shapes.push({x:100, y:150, width:100, height:100, color: 'blue'});
shapes.push({x:250, y:250, width:200, height:200, color: 'yellow'});
shapes.push({x:400, y:350, width:200, height:200, color: 'green'});
shapes.push({x:500, y:450, width:100, height:200, color: 'orange'});

let is_mouse_in_shape = function(x, y, shape) {
    let shape_left = shape.x;
    let shape_right = shape.x + shape.width;
    let shape_top = shape.y;
    let shape_bottom = shape.y + shape.height;

    if (x>shape_left && x<shape_right && y>shape_top && y<shape_bottom) {
        return true;
    }
    return false;
}

let mouse_down = function(event) {
    event.preventDefault();

    startX = parseInt(event.clientX);
    startY = parseInt(event.clientY);

    let index = 0;
    for (let shape of shapes) {
        if (is_mouse_in_shape(startX, startY, shape)) {
            current_shape_index = index;
            is_dragging = true;
            return;
        }
        index++;
    }
}

let mouse_up = function(event) {
    if (!is_dragging) {
        return;
    }
    event.preventDefault();
    is_dragging = false;
}

let mouse_out = function(event) {
    if (!is_dragging) {
        return;
    }
    event.preventDefault();
    is_dragging = false;
}

let mouse_move = function(event) {
    if (!is_dragging) {
        return;
    } else {
        event.preventDefault();

        let mouseX = parseInt(event.clientX);
        let mouseY = parseInt(event.clientY);

        let dx = mouseX - startX;
        let dy = mouseY - startY;

        let current_shape = shapes[current_shape_index];
        //actual moove of the current shape:
        current_shape.x += dx;
        current_shape.y += dy;

        draw_shapes();

        startX = mouseX;
        startY = mouseY;
    }
}

canvas.onmousedown = mouse_down;
canvas.onmouseup   = mouse_up;
canvas.onmouseout  = mouse_out;
canvas.onmousemove = mouse_move;

//wzor shapes.forEach(e => {console.log(e.color)})

// let draw_shapes3 = function () {
//     context.clearRect(0,0, canvas_width, canvas_height);    
//     shapes.forEach(e=>{
//         context.fillStyle = e.color;
//         context.fillRect(e.x, e.y, e.width, e.height);        
//     });
// }


//to jest ok:
// /*
let draw_shapes = function() {
    context.clearRect(0,0, canvas_width, canvas_height);
    for (let shape of shapes) {
        context.fillStyle = shape.color;
        context.fillRect(shape.x, shape.y, shape.width, shape.height);
        //wypisanie tekstu:
        context.fillStyle = 'black';
        context.font = '28px Courier';
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.fillText('aaaaa',shape.x + shape.width/2, shape.y + shape.height/2);
    }
}

// */
// let draw_shapes = function() {
//     /* Element, ktory ma focus, zostaje wyrysowany na koncu - imitacja najwyższego "z-index" */
//     context.clearRect(0,0, canvas_width, canvas_height);
//     let idx = 0;
//     for (let shape of shapes) {
//         if (idx !== current_shape_index) {
//             context.fillStyle = shape.color;
//             context.fillRect(shape.x, shape.y, shape.width, shape.height);
//         }
//         idx++;
//     }
//     context.fillStyle = shapes[current_shape_index].color;
//     context.fillRect(shapes[current_shape_index].x, shapes[current_shape_index].y, shapes[current_shape_index].width, shapes[current_shape_index].height);
// }

draw_shapes();