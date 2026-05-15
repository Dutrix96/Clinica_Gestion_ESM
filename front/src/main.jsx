import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import './styles.css';

const API = '';

const emptyPaciente = {
  nombre: '',
  apellidos: '',
  dni: '',
  telefono: '',
  email: '',
  fecha_nacimiento: ''
};

const emptyCita = {
  id_paciente: '',
  id_medico: '',
  fecha_hora: '',
  motivo: '',
  duracion_minutos: 30
};

const emptyEntrada = {
  id_paciente: '',
  id_cita: '',
  diagnostico: '',
  tratamiento: '',
  observaciones: ''
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || 'null'));
  const [tab, setTab] = useState('pacientes');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [socketMsg, setSocketMsg] = useState('');
  const [pendientesHoy, setPendientesHoy] = useState(0);
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [pacienteForm, setPacienteForm] = useState(emptyPaciente);
  const [citaForm, setCitaForm] = useState(emptyCita);
  const [entradaForm, setEntradaForm] = useState(emptyEntrada);
  const [usuarioForm, setUsuarioForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'medico',
    especialidad: ''
  });
  const [cantidad, setCantidad] = useState(5);

  const tabs = useMemo(() => {
    if (!usuario) return [];
    const permisos = {
      administrador: ['pacientes', 'citas', 'historial', 'admin'],
      medico: ['pacientes', 'citas', 'historial'],
      recepcionista: ['pacientes', 'citas']
    };
    return permisos[usuario.rol] || [];
  }, [usuario]);

  const authFetch = async (url, options = {}) => {
    const res = await fetch(API + url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-token': token,
        ...(options.headers || {})
      }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.msg || 'Error en la peticion');
    return data;
  };

  const cargarPacientes = async () => {
    const data = await authFetch('/api/pacientes');
    setPacientes(data);
  };

  const cargarCitas = async () => {
    const data = await authFetch('/api/citas');
    setCitas(data);
  };

  const cargarMetricas = async () => {
    if (!usuario || usuario.rol !== 'administrador') return;
    const data = await authFetch('/api/metricas');
    setMetricas(data);
    setPendientesHoy(data.pendientesHoy);
  };

  const cargarTodo = async () => {
    try {
      await Promise.all([cargarPacientes(), cargarCitas(), cargarMetricas()]);
    } catch (error) {
      setMsg(error.message);
    }
  };

  useEffect(() => {
    if (!token || !usuario) return;
    setTab(usuario.rol === 'medico' ? 'citas' : 'pacientes');
    cargarTodo();

    const socket = io('http://localhost:9090');
    socket.on('citasActualizadas', data => {
      setPendientesHoy(data.pendientesHoy);
      setSocketMsg(`Agenda actualizada: ${data.accion}`);
      cargarCitas();
      cargarMetricas();
      setTimeout(() => setSocketMsg(''), 3500);
    });

    return () => socket.disconnect();
  }, [token, usuario?.id]);

  const handleLogin = async event => {
    event.preventDefault();
    setMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Login incorrecto');
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      setToken(data.token);
      setUsuario(data.usuario);
    } catch (error) {
      setMsg(error.message);
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken('');
    setUsuario(null);
  };

  const crearPaciente = async event => {
    event.preventDefault();
    await authFetch('/api/pacientes', { method: 'POST', body: JSON.stringify(pacienteForm) });
    setPacienteForm(emptyPaciente);
    cargarPacientes();
  };

  const crearCita = async event => {
    event.preventDefault();
    await authFetch('/api/citas', {
      method: 'POST',
      body: JSON.stringify({
        ...citaForm,
        id_paciente: Number(citaForm.id_paciente),
        id_medico: Number(citaForm.id_medico),
        duracion_minutos: Number(citaForm.duracion_minutos)
      })
    });
    setCitaForm(emptyCita);
  };

  const cambiarEstado = async (id, estado) => {
    await authFetch(`/api/citas/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado })
    });
    cargarCitas();
  };

  const eliminarPaciente = async id => {
    await authFetch(`/api/pacientes/${id}`, { method: 'DELETE' });
    cargarPacientes();
  };

  const eliminarCita = async id => {
    await authFetch(`/api/citas/${id}`, { method: 'DELETE' });
    cargarCitas();
  };

  const buscarHistorial = async event => {
    event.preventDefault();
    const id = event.currentTarget.id_paciente.value;
    const data = await authFetch(`/api/historiales/${id}`);
    setHistorial(data);
  };

  const crearEntrada = async event => {
    event.preventDefault();
    await authFetch('/api/historiales/entrada', {
      method: 'POST',
      body: JSON.stringify({
        ...entradaForm,
        id_paciente: Number(entradaForm.id_paciente),
        id_cita: Number(entradaForm.id_cita)
      })
    });
    setEntradaForm(emptyEntrada);
    cargarCitas();
  };

  const crearUsuario = async event => {
    event.preventDefault();
    await authFetch('/api/usuarios', { method: 'POST', body: JSON.stringify(usuarioForm) });
    setUsuarioForm({ nombre: '', email: '', password: '', rol: 'medico', especialidad: '' });
  };

  const generarPacientes = async event => {
    event.preventDefault();
    await authFetch('/api/pacientes/generar', {
      method: 'POST',
      body: JSON.stringify({ cantidad: Number(cantidad) })
    });
    cargarPacientes();
  };

  if (!token || !usuario) {
    return (
      <main className="shell login-shell">
        <section className="panel login-panel">
          <h1>Clinica Gestion</h1>
          <form onSubmit={handleLogin} className="stack">
            <input placeholder="Email" value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} />
            <input placeholder="Password" type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} />
            <button>Entrar</button>
          </form>
          {msg && <p className="error">{msg}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Panel principal</h1>
          <p>{usuario.nombre} · {usuario.rol}</p>
        </div>
        <div className="counter">
          <span>Citas pendientes hoy</span>
          <strong>{pendientesHoy}</strong>
        </div>
        <p className="notice">{socketMsg}</p>
        <button onClick={logout}>Salir</button>
      </header>

      <nav className="tabs">
        {tabs.map(item => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      {tab === 'pacientes' && (
        <section className="panel">
          <h2>Pacientes</h2>
          {usuario.rol !== 'medico' && (
            <form onSubmit={crearPaciente} className="grid">
              {Object.keys(emptyPaciente).map(field => (
                <input
                  key={field}
                  type={field === 'fecha_nacimiento' ? 'date' : 'text'}
                  placeholder={field}
                  value={pacienteForm[field]}
                  onChange={e => setPacienteForm({ ...pacienteForm, [field]: e.target.value })}
                />
              ))}
              <button>Crear paciente</button>
            </form>
          )}
          <div className="list">
            {pacientes.map(paciente => (
              <article className="item" key={paciente.id}>
                <strong>#{paciente.id} {paciente.nombre} {paciente.apellidos}</strong>
                <span>{paciente.dni} · {paciente.telefono || 'sin telefono'} · {paciente.email || 'sin email'}</span>
                {usuario.rol === 'administrador' && <button className="danger" onClick={() => eliminarPaciente(paciente.id)}>Eliminar</button>}
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'citas' && (
        <section className="panel">
          <h2>Citas</h2>
          {usuario.rol !== 'medico' && (
            <form onSubmit={crearCita} className="grid">
              <input placeholder="ID paciente" value={citaForm.id_paciente} onChange={e => setCitaForm({ ...citaForm, id_paciente: e.target.value })} />
              <input placeholder="ID medico" value={citaForm.id_medico} onChange={e => setCitaForm({ ...citaForm, id_medico: e.target.value })} />
              <input type="datetime-local" value={citaForm.fecha_hora} onChange={e => setCitaForm({ ...citaForm, fecha_hora: e.target.value })} />
              <input placeholder="Motivo" value={citaForm.motivo} onChange={e => setCitaForm({ ...citaForm, motivo: e.target.value })} />
              <input type="number" min="5" value={citaForm.duracion_minutos} onChange={e => setCitaForm({ ...citaForm, duracion_minutos: e.target.value })} />
              <button>Crear cita</button>
            </form>
          )}
          <div className="list">
            {citas.map(cita => (
              <article className="item" key={cita.id}>
                <strong>#{cita.id} {cita.paciente_nombre} {cita.paciente_apellidos}</strong>
                <span>{cita.medico_nombre} · {new Date(cita.fecha_hora).toLocaleString()} · {cita.estado}</span>
                <span>{cita.motivo}</span>
                <div className="row">
                  {usuario.rol === 'medico' && <button onClick={() => cambiarEstado(cita.id, 'en curso')}>En curso</button>}
                  {usuario.rol === 'medico' && <button onClick={() => cambiarEstado(cita.id, 'finalizada')}>Finalizada</button>}
                  {(usuario.rol === 'recepcionista' || usuario.rol === 'administrador') && <button className="danger" onClick={() => cambiarEstado(cita.id, 'cancelada')}>Cancelar</button>}
                  {usuario.rol === 'administrador' && <button className="danger" onClick={() => eliminarCita(cita.id)}>Eliminar</button>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'historial' && (
        <section className="panel">
          <h2>Historial clinico</h2>
          <form onSubmit={buscarHistorial} className="inline">
            <input name="id_paciente" placeholder="ID paciente" />
            <button>Consultar</button>
          </form>
          {usuario.rol === 'medico' && (
            <form onSubmit={crearEntrada} className="grid">
              <input placeholder="ID paciente" value={entradaForm.id_paciente} onChange={e => setEntradaForm({ ...entradaForm, id_paciente: e.target.value })} />
              <input placeholder="ID cita" value={entradaForm.id_cita} onChange={e => setEntradaForm({ ...entradaForm, id_cita: e.target.value })} />
              <input placeholder="Diagnostico" value={entradaForm.diagnostico} onChange={e => setEntradaForm({ ...entradaForm, diagnostico: e.target.value })} />
              <input placeholder="Tratamiento" value={entradaForm.tratamiento} onChange={e => setEntradaForm({ ...entradaForm, tratamiento: e.target.value })} />
              <textarea placeholder="Observaciones" value={entradaForm.observaciones} onChange={e => setEntradaForm({ ...entradaForm, observaciones: e.target.value })} />
              <button>Guardar entrada</button>
            </form>
          )}
          <div className="list">
            {historial?.entradas?.map((entrada, index) => (
              <article className="item" key={`${entrada.fecha}-${index}`}>
                <strong>{new Date(entrada.fecha).toLocaleString()} · medico #{entrada.id_medico}</strong>
                <span>Diagnostico: {entrada.diagnostico}</span>
                <span>Tratamiento: {entrada.tratamiento}</span>
                <span>{entrada.observaciones}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'admin' && usuario.rol === 'administrador' && (
        <section className="panel">
          <h2>Administracion</h2>
          <form onSubmit={crearUsuario} className="grid">
            <input placeholder="Nombre" value={usuarioForm.nombre} onChange={e => setUsuarioForm({ ...usuarioForm, nombre: e.target.value })} />
            <input placeholder="Email" value={usuarioForm.email} onChange={e => setUsuarioForm({ ...usuarioForm, email: e.target.value })} />
            <input placeholder="Password" type="password" value={usuarioForm.password} onChange={e => setUsuarioForm({ ...usuarioForm, password: e.target.value })} />
            <select value={usuarioForm.rol} onChange={e => setUsuarioForm({ ...usuarioForm, rol: e.target.value })}>
              <option value="medico">Medico</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="administrador">Administrador</option>
            </select>
            <input placeholder="Especialidad" value={usuarioForm.especialidad} onChange={e => setUsuarioForm({ ...usuarioForm, especialidad: e.target.value })} />
            <button>Crear usuario</button>
          </form>
          <form onSubmit={generarPacientes} className="inline">
            <input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} />
            <button>Generar pacientes</button>
          </form>
          {metricas && <pre>{JSON.stringify(metricas, null, 2)}</pre>}
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
