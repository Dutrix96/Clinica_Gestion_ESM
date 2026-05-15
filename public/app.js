const API = '';
let token = localStorage.getItem('token');
let usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
let socket = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const authFetch = async (url, options = {}) => {
  const res = await fetch(API + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-token': token,
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ msg: 'Error desconocido' }));
    throw new Error(error.msg || 'Error en la peticion');
  }

  return res.json();
};

const formData = form => Object.fromEntries(new FormData(form).entries());

const mostrarTab = id => {
  $$('.tab').forEach(tab => tab.classList.add('hidden'));
  $('#' + id).classList.remove('hidden');
};

const aplicarRol = () => {
  $('#userInfo').textContent = `${usuario.nombre} · ${usuario.rol}`;

  const permisosTabs = {
    administrador: ['pacientes', 'citas', 'historial', 'admin'],
    medico: ['pacientes', 'citas', 'historial'],
    recepcionista: ['pacientes', 'citas']
  };

  $$('.tabs button').forEach(btn => {
    btn.classList.toggle('hidden', !permisosTabs[usuario.rol].includes(btn.dataset.tab));
  });

  $('#admin').classList.toggle('hidden', usuario.rol !== 'administrador');
  $('#historial').classList.toggle('hidden', usuario.rol === 'recepcionista');
  $('#pacienteForm').classList.toggle('hidden', usuario.rol === 'medico');
  $('#citaForm').classList.toggle('hidden', usuario.rol === 'medico');
  $('#entradaForm').classList.toggle('hidden', usuario.rol !== 'medico');
};

const iniciarApp = async () => {
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  aplicarRol();
  mostrarTab(usuario.rol === 'medico' ? 'citas' : 'pacientes');
  conectarSocket();
  await Promise.all([cargarPacientes(), cargarCitas(), cargarMetricas()]);
};

const conectarSocket = () => {
  socket = io();
  socket.on('citasActualizadas', data => {
    $('#pendientesHoy').textContent = data.pendientesHoy;
    $('#socketMsg').textContent = `Agenda actualizada: ${data.accion}`;
    cargarCitas();
    cargarMetricas();
    setTimeout(() => {
      $('#socketMsg').textContent = '';
    }, 3500);
  });
};

const cargarPacientes = async () => {
  const pacientes = await authFetch('/api/pacientes');
  $('#pacientesLista').innerHTML = pacientes.map(p => `
    <article class="item">
      <strong>#${p.id} ${p.nombre} ${p.apellidos}</strong>
      <span class="muted">${p.dni || ''} ${p.telefono || ''} ${p.email || ''}</span>
      ${usuario.rol === 'administrador' ? `<button class="danger" onclick="eliminarPaciente(${p.id})">Eliminar</button>` : ''}
    </article>
  `).join('');
};

const cargarCitas = async () => {
  const citas = await authFetch('/api/citas');
  $('#citasLista').innerHTML = citas.map(c => `
    <article class="item">
      <strong>#${c.id} ${c.paciente_nombre} ${c.paciente_apellidos}</strong>
      <span>Medico: ${c.medico_nombre} · ${new Date(c.fecha_hora).toLocaleString()} · ${c.estado}</span>
      <span class="muted">${c.motivo}</span>
      <div class="row">
        ${usuario.rol === 'medico' ? `<button class="secondary" onclick="cambiarEstado(${c.id}, 'en curso')">En curso</button>` : ''}
        ${usuario.rol === 'medico' ? `<button class="secondary" onclick="cambiarEstado(${c.id}, 'finalizada')">Finalizada</button>` : ''}
        ${usuario.rol === 'recepcionista' || usuario.rol === 'administrador' ? `<button class="danger" onclick="cambiarEstado(${c.id}, 'cancelada')">Cancelar</button>` : ''}
        ${usuario.rol === 'administrador' ? `<button class="danger" onclick="eliminarCita(${c.id})">Eliminar</button>` : ''}
      </div>
    </article>
  `).join('');
};

const cargarMetricas = async () => {
  if (!usuario || usuario.rol !== 'administrador') return;
  const metricas = await authFetch('/api/metricas');
  $('#metricas').textContent = JSON.stringify(metricas, null, 2);
  $('#pendientesHoy').textContent = metricas.pendientesHoy;
};

window.cambiarEstado = async (id, estado) => {
  await authFetch(`/api/citas/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estado })
  });
  await cargarCitas();
};

window.eliminarCita = async id => {
  await authFetch(`/api/citas/${id}`, { method: 'DELETE' });
  await cargarCitas();
};

window.eliminarPaciente = async id => {
  await authFetch(`/api/pacientes/${id}`, { method: 'DELETE' });
  await cargarPacientes();
};

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData(e.target))
    }).then(res => res.json());

    if (!data.token) throw new Error(data.msg || 'Login incorrecto');
    token = data.token;
    usuario = data.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    await iniciarApp();
  } catch (error) {
    $('#loginMsg').textContent = error.message;
  }
});

$('#logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  location.reload();
});

$$('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => mostrarTab(btn.dataset.tab));
});

$('#pacienteForm').addEventListener('submit', async e => {
  e.preventDefault();
  await authFetch('/api/pacientes', {
    method: 'POST',
    body: JSON.stringify(formData(e.target))
  });
  e.target.reset();
  await cargarPacientes();
});

$('#citaForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = formData(e.target);
  data.id_paciente = Number(data.id_paciente);
  data.id_medico = Number(data.id_medico);
  data.duracion_minutos = Number(data.duracion_minutos);
  await authFetch('/api/citas', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  e.target.reset();
});

$('#usuarioForm').addEventListener('submit', async e => {
  e.preventDefault();
  await authFetch('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(formData(e.target))
  });
  e.target.reset();
});

$('#generarForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = formData(e.target);
  data.cantidad = Number(data.cantidad);
  await authFetch('/api/pacientes/generar', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  await cargarPacientes();
});

$('#buscarHistorialForm').addEventListener('submit', async e => {
  e.preventDefault();
  const { id_paciente } = formData(e.target);
  const historial = await authFetch(`/api/historiales/${id_paciente}`);
  $('#historialDetalle').innerHTML = historial.entradas.map(entrada => `
    <article class="item">
      <strong>${new Date(entrada.fecha).toLocaleString()} · medico #${entrada.id_medico}</strong>
      <span>Diagnostico: ${entrada.diagnostico}</span>
      <span>Tratamiento: ${entrada.tratamiento}</span>
      <span class="muted">${entrada.observaciones}</span>
    </article>
  `).join('') || '<p>Sin entradas clinicas.</p>';
});

$('#entradaForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = formData(e.target);
  data.id_paciente = Number(data.id_paciente);
  data.id_cita = Number(data.id_cita);
  await authFetch('/api/historiales/entrada', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  e.target.reset();
  await cargarCitas();
});

if (token && usuario) {
  iniciarApp();
}
