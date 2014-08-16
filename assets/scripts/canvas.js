
function canvas_init_pre() {
  prop.canvas={};

  prop.canvas.contexts={};

  // resize canvas to fit window?
  prop.canvas.resize=true;
  prop.canvas.size={ // all canvases are the same size
    height:480,
    width:640
  };

  prop.canvas.last = time();

  prop.canvas.dirty = true;
}

function canvas_init() {
  canvas_add("navaids");
  canvas_add("aircraft");
  canvas_add("info");
}

function canvas_complete() {
  setTimeout(function() {
    prop.canvas.dirty = true;
  }, 500);
  prop.canvas.last = time();
}

function canvas_resize() {
  if(prop.canvas.resize) {
    prop.canvas.size.width  = $(window).width();
    prop.canvas.size.height = $(window).height();
  }
  prop.canvas.size.width  -= 250;
  prop.canvas.size.height -= 36;
  for(var i in prop.canvas.contexts) {
    prop.canvas.contexts[i].canvas.height=prop.canvas.size.height;
    prop.canvas.contexts[i].canvas.width=prop.canvas.size.width;
  }
  prop.canvas.dirty = true;
}

function canvas_add(name) {
  $("#canvases").append("<canvas id='"+name+"-canvas'></canvas>");
  prop.canvas.contexts[name]=$("#"+name+"-canvas").get(0).getContext("2d");
}

function canvas_get(name) {
  return(prop.canvas.contexts[name]);
}

function canvas_clear(cc) {
  cc.clearRect(0,0,prop.canvas.size.width,prop.canvas.size.height);
}

function canvas_should_draw() {
  var elapsed = time() - prop.canvas.last;
  if(elapsed > (1/prop.game.speedup)) {
    prop.canvas.last = time();
    return true;
  }
  return false;
}

// DRAW

function canvas_draw_runway(cc, runway) {
  var length2 = round(km(runway.length / 2));
  var angle   = runway.angle;

  var size  = 20;
  var size2 = size / 2;

  cc.translate(round(km(runway.position[0])), -round(km(runway.position[1])));

  cc.rotate(angle);

  cc.moveTo(0, -length2);
  cc.lineTo(0,  length2);

  var text_height = 8;
  cc.textAlign    = "center";
  cc.textBaseline = "middle";

  cc.save();
  cc.translate(0,  length2 + text_height);
  cc.rotate(-angle);
  cc.translate(round(km(runway.name_offset[0][0])), -round(km(runway.name_offset[0][1])));
  cc.fillText(runway.name[0], 0, 0);
  cc.restore();

  cc.save();
  cc.translate(0, -length2 - text_height);
  cc.rotate(-angle);
  cc.translate(round(km(runway.name_offset[1][0])), -round(km(runway.name_offset[1][1])));
  cc.fillText(runway.name[1], 0, 0);
  cc.restore();
}

function canvas_draw_runways(cc) {
  cc.strokeStyle = "rgba(255, 255, 255, 0.8)";
  cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
  cc.lineWidth   = 4;
  var airport=airport_get();
  cc.beginPath();
  for(var i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway(cc, airport.runways[i]);
    cc.restore();
  }
  cc.stroke();
}

function canvas_draw_aircraft(cc, aircraft) {

  if(!aircraft.isVisible()) return;

  var size = 3;

  cc.fillStyle   = "rgba(224, 224, 224, 1.0)";
  if(aircraft.warning)
    cc.fillStyle = "rgba(224, 128, 128, 1.0)";
  if(aircraft.hit)
    cc.fillStyle = "rgba(255, 64, 64, 1.0)";
  cc.strokeStyle = cc.fillStyle;

  cc.translate(km(aircraft.position[0]), -km(aircraft.position[1]));

  if(!aircraft.hit) {
    cc.save();

    var tail_length = 10;
    var angle       = aircraft.heading;
    var end         = [-sin(angle) * tail_length, cos(angle) * tail_length];

    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(end[0], end[1]);
    cc.stroke();
    cc.restore();
  }

  cc.beginPath();
  cc.arc(0, 0, size, 0, Math.PI * 2);
  cc.fill();
}

function canvas_draw_all_aircraft(cc) {
  cc.fillStyle   = "rgba(224, 224, 224, 1.0)";
  cc.strokeStyle = "rgba(224, 224, 224, 1.0)";
  cc.lineWidth   = 2;
  for(var i=0;i<prop.aircraft.list.length;i++) {
    cc.save();
    canvas_draw_aircraft(cc, prop.aircraft.list[i]);
    cc.restore();
  }
}

function canvas_draw_info(cc, aircraft) {

  if(!aircraft.isVisible()) return;

  if(!aircraft.hit) {
    cc.save();

    cc.translate(round(km(aircraft.position[0])), -round(km(aircraft.position[1])));

    cc.textBaseline = "middle";

    var width  = 60;
    var width2 = width / 2;

    var height  = 35;
    var height2 = height / 2;

    if(-km(aircraft.position[1]) + prop.canvas.size.height/2 < height * 1.5)
      cc.translate(0,  height2 + 12);
    else
      cc.translate(0, -height2 - 12);

    cc.fillStyle = "rgba(71, 105, 88, 0.5)";
    if(prop.input.callsign.length > 1 && aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1)))
      cc.fillStyle = "rgba(128, 105, 88, 0.5)";
    if(prop.input.callsign.length > 0 && aircraft.matchCallsign(prop.input.callsign))
      cc.fillStyle = "rgba(128, 200, 255, 0.5)";

    cc.fillRect(-width2, -height2, width, height);

    cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
    cc.strokeStyle = cc.fillStyle;

    cc.translate(0, 1);

    var separation  = 8;
    var line_height = 8;

    cc.lineWidth = 2;

    if(aircraft.trend != 0) {
      cc.save();
      if(aircraft.trend < 0) {
        cc.translate(1, 6.5);
      } else if(aircraft.trend > 0) {
        cc.translate(-1, 6.5);
        cc.scale(-1, -1);
      }
      cc.lineJoin  = "round";
      cc.beginPath();

      cc.moveTo(0,  -5);
      cc.lineTo(0,   5);
      cc.lineTo(-3,  2);

      cc.stroke();
      cc.restore();
    } else {
      cc.beginPath();
      cc.moveTo(-4, 7.5);
      cc.lineTo( 4, 7.5);
      cc.stroke();
    }

    cc.textAlign = "right";
    cc.fillText(round(aircraft.altitude * 0.01), -separation, line_height);

    cc.textAlign = "left";
    cc.fillText(round(aircraft.speed * 0.1), separation, line_height);

    cc.textAlign = "center";
    cc.fillText(aircraft.airline + aircraft.callsign, 0, -line_height);

    cc.restore();
  }

}

function canvas_draw_all_info(cc) {
  for(var i=0;i<prop.aircraft.list.length;i++) {
    cc.save();
    canvas_draw_info(cc, prop.aircraft.list[i]);
    cc.restore();
  }
}

function canvas_update_post() {
  var cc=canvas_get("navaids");

  cc.font = "9px monoOne, monospace";

  cc.save();
  if(prop.canvas.dirty || true) {
    canvas_clear(cc);
    cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
    canvas_draw_runways(cc);
  }
  cc.restore();

  //

  cc=canvas_get("aircraft");

  cc.save();
  if(prop.canvas.dirty || canvas_should_draw() || true) {
    canvas_clear(cc);
    cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
    canvas_draw_all_aircraft(cc);
  }
  cc.restore();

  //

  cc=canvas_get("info");

  cc.font = "10px monoOne, monospace";

  cc.save();
  canvas_clear(cc);
  cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));

  var size  = 20;
  var size2 = size / 2;

  canvas_draw_all_info(cc);
//  cc.fillRect(km(prop.input.click[0])-size2, km(-prop.input.click[1])-size2, size, size);
  cc.restore();

  prop.canvas.dirty = false;
}