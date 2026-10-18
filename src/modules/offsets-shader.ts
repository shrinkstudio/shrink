// -----------------------------------------
// OFFSETS SHADER — grainy gradient cut into offset slabs (WebGL1)
// -----------------------------------------
// Our own take on the shaders.com Offsets look: soft drifting blobs sampled
// through tall columns, some split into stacked slabs, each slab shifted so
// the gradient breaks at its edges. Settles to the darkest colour at the
// bottom so type reads. About 1.4 KB gzipped; replaces Paper Shaders.
//
// Five colours, darkest first. Fewer repeat the last; more are ignored.
// -----------------------------------------

const FRAG = `precision highp float;
uniform vec2 r;uniform float t;uniform vec3 c[5];uniform float g;
float h(float n){return fract(sin(n)*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 pal(float x){x=clamp(x,0.,1.)*4.;vec3 o=mix(c[0],c[1],clamp(x,0.,1.));o=mix(o,c[2],clamp(x-1.,0.,1.));o=mix(o,c[3],clamp(x-2.,0.,1.));return mix(o,c[4],clamp(x-3.,0.,1.));}
float blobs(vec2 p,float ar){float v=0.;for(int i=0;i<5;i++){float f=float(i);vec2 q=vec2(ar*(.5+.45*sin(t*(.07+f*.013)+f*2.1)),.5+.42*cos(t*(.06+f*.011)+f*1.7));float w=.24+.14*h(f+9.);v+=exp(-dot(p-q,p-q)/(w*w))*(.35+.65*h(f+4.));}return clamp(.18+v*.62,0.,1.);}
void main(){vec2 uv=gl_FragCoord.xy/r;float ar=r.x/r.y;
float col=step(.07,uv.x)+step(.31,uv.x)+step(.56,uv.x)+step(.8,uv.x);
float n=1.+floor(h(col*3.7+1.)*3.);vec2 id=vec2(col,floor((uv.y+h(col+11.)*.4)*n));
vec2 p=uv*vec2(ar,1.)+(vec2(h2(id+1.3),h2(id+7.7))-.5)*vec2(.55,.38);
vec3 o=pal(blobs(p,ar)+(h2(id+3.1)-.5)*.12);o=mix(o,c[0],smoothstep(.45,0.,uv.y)*.55);
gl_FragColor=vec4(o+(h2(gl_FragCoord.xy+fract(t)*100.)-.5)*g*.35,1.);}`;

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

const toRgb = (hex: string) => {
  const s = hex.trim().replace('#', '');
  const full = s.length === 3 ? [...s].map((ch) => ch + ch).join('') : s;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};

export interface OffsetsOptions {
  colors: string[];
  grain?: number;
  /* 1 = designed pace, 0 = still frame */
  speed?: number;
}

export class OffsetsMount {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private raf = 0;
  private time = 0;
  private last = 0;
  private speed: number;
  private resize: ResizeObserver;
  private uRes: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;

  /* throws when WebGL is missing so callers keep their CSS fallback */
  constructor(el: HTMLElement, { colors, grain = 0.22, speed = 1 }: OffsetsOptions) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('webgl unavailable');

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('offsets shader failed');
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const five = Array.from({ length: 5 }, (_, i) => colors[Math.min(i, colors.length - 1)]);
    gl.uniform3fv(gl.getUniformLocation(prog, 'c'), new Float32Array(five.flatMap(toRgb)));
    gl.uniform1f(gl.getUniformLocation(prog, 'g'), grain);
    this.uRes = gl.getUniformLocation(prog, 'r');
    this.uTime = gl.getUniformLocation(prog, 't');

    this.canvas = canvas;
    this.gl = gl;
    this.speed = speed;
    el.prepend(canvas);

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(canvas);
    this.fit();
    this.draw();
    if (speed > 0) this.start();
  }

  private fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.uRes, this.canvas.width, this.canvas.height);
    this.draw();
  }

  private draw() {
    this.gl.uniform1f(this.uTime, this.time);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  private start() {
    if (this.raf) return;
    this.last = performance.now();
    const frame = (now: number) => {
      this.time += ((now - this.last) / 1000) * this.speed;
      this.last = now;
      this.draw();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  setSpeed(speed: number) {
    this.speed = speed;
    if (speed > 0) this.start();
    else {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resize.disconnect();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.canvas.remove();
  }
}
