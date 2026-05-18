import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import './styles.css';

const API = '';
const MENSAJE_CITA_PASADO = 'Fernando no tienes un Delorian para viajar al pasado';

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

const emptyFinalizacion = {
  diagnostico: '',
  tratamiento: '',
  observaciones: ''
};

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token') || '');
  const [usuario, setUsuario] = useState(JSON.parse(sessionStorage.getItem('usuario') || 'null'));
  const [tab, setTab] = useState('pacientes');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [pendientesHoy, setPendientesHoy] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [pacienteForm, setPacienteForm] = useState(emptyPaciente);
  const [citaForm, setCitaForm] = useState(emptyCita);
  const [citaEditando, setCitaEditando] = useState(null);
  const [citaCerrando, setCitaCerrando] = useState(null);
  const [finalizacionForm, setFinalizacionForm] = useState(emptyFinalizacion);
  const [usuarioForm, setUsuarioForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'medico',
    especialidad: ''
  });
  const [usuarioEditando, setUsuarioEditando] = useState(null);
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
    if (!res.ok) {
      setMsg(data.msg || 'Error en la peticion');
      throw new Error(data.msg || 'Error en la peticion');
    }
    setMsg('');
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

  const cargarMedicos = async () => {
    const data = await authFetch('/api/usuarios/medicos');
    setMedicos(data);
  };

  const cargarMetricas = async () => {
    if (!usuario) return;
    const data = await authFetch('/api/metricas');
    setMetricas(data);
    setPendientesHoy(data.pendientesHoy);
  };

  const cargarUsuarios = async () => {
    if (!usuario || usuario.rol !== 'administrador') return;
    const data = await authFetch('/api/usuarios');
    setUsuarios(data);
  };

  const cargarTodo = async () => {
    try {
      await Promise.all([cargarPacientes(), cargarMedicos(), cargarCitas(), cargarMetricas(), cargarUsuarios()]);
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
      cargarCitas();
      cargarMetricas();
    });
    socket.on('pacientesActualizados', data => {
      cargarPacientes();
      cargarMetricas();
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
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
      setToken(data.token);
      setUsuario(data.usuario);
    } catch (error) {
      setMsg(error.message);
    }
  };

  const logout = () => {
    sessionStorage.clear();
    setToken('');
    setUsuario(null);
  };

  const crearPaciente = async event => {
    event.preventDefault();
    await authFetch('/api/pacientes', { method: 'POST', body: JSON.stringify(pacienteForm) });
    setPacienteForm(emptyPaciente);
    await cargarPacientes();
  };

  const crearCita = async event => {
    event.preventDefault();

    if (new Date(citaForm.fecha_hora).getTime() < Date.now()) {
      setMsg(MENSAJE_CITA_PASADO);
      return;
    }

    const payload = {
      ...citaForm,
      id_paciente: Number(citaForm.id_paciente),
      id_medico: Number(citaForm.id_medico),
      duracion_minutos: Number(citaForm.duracion_minutos)
    };

    await authFetch(citaEditando ? `/api/citas/${citaEditando}` : '/api/citas', {
      method: citaEditando ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    setCitaForm(emptyCita);
    setCitaEditando(null);
    await cargarCitas();
  };

  const editarCita = cita => {
    setCitaEditando(cita.id);
    setCitaForm({
      id_paciente: String(cita.id_paciente),
      id_medico: String(cita.id_medico),
      fecha_hora: new Date(cita.fecha_hora).toISOString().slice(0, 16),
      motivo: cita.motivo,
      duracion_minutos: cita.duracion_minutos
    });
    setTab('citas');
  };

  const cancelarEdicionCita = () => {
    setCitaEditando(null);
    setCitaForm(emptyCita);
  };

  const cancelarCita = async id => {
    await authFetch(`/api/citas/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({
        estado: 'cancelada'
      })
    });
    await cargarCitas();
  };

  const cambiarEstado = async (id, estado) => {
    await authFetch(`/api/citas/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado })
    });
    await cargarCitas();
  };

  const abrirFinalizacion = cita => {
    setCitaCerrando(cita.id);
    setFinalizacionForm(emptyFinalizacion);
  };

  const cancelarFinalizacion = () => {
    setCitaCerrando(null);
    setFinalizacionForm(emptyFinalizacion);
  };

  const guardarFinalizacion = async (event, cita) => {
    event.preventDefault();
    await authFetch('/api/historiales/entrada', {
      method: 'POST',
      body: JSON.stringify({
        id_paciente: Number(cita.id_paciente),
        id_cita: Number(cita.id),
        ...finalizacionForm
      })
    });
    setCitaCerrando(null);
    setFinalizacionForm(emptyFinalizacion);
    await cargarCitas();
    const data = await authFetch(`/api/historiales/${cita.id_paciente}`);
    setHistorial(data);
  };

  const eliminarPaciente = async id => {
    await authFetch(`/api/pacientes/${id}`, { method: 'DELETE' });
    await cargarPacientes();
  };

  const eliminarCita = async id => {
    await authFetch(`/api/citas/${id}`, { method: 'DELETE' });
    await cargarCitas();
  };

  const buscarHistorial = async event => {
    event.preventDefault();
    const id = event.currentTarget.id_paciente.value;
    const data = await authFetch(`/api/historiales/${id}`);
    setHistorial(data);
  };

  const borrarHistorial = async idPaciente => {
    await authFetch(`/api/historiales/${idPaciente}`, { method: 'DELETE' });
    const data = await authFetch(`/api/historiales/${idPaciente}`);
    setHistorial(data);
  };

  const crearUsuario = async event => {
    event.preventDefault();
    const payload = {
      ...usuarioForm,
      especialidad: usuarioForm.rol === 'medico' ? usuarioForm.especialidad : ''
    };

    await authFetch(usuarioEditando ? `/api/usuarios/${usuarioEditando}` : '/api/usuarios', {
      method: usuarioEditando ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    setUsuarioForm({ nombre: '', email: '', password: '', rol: 'medico', especialidad: '' });
    setUsuarioEditando(null);
    await cargarUsuarios();
    await cargarMedicos();
  };

  const editarUsuario = user => {
    setUsuarioEditando(user.id);
    setUsuarioForm({
      nombre: user.nombre,
      email: user.email,
      password: '',
      rol: user.rol,
      especialidad: user.especialidad || '',
      activo: user.activo
    });
  };

  const cancelarEdicionUsuario = () => {
    setUsuarioEditando(null);
    setUsuarioForm({ nombre: '', email: '', password: '', rol: 'medico', especialidad: '' });
  };

  const eliminarUsuario = async id => {
    await authFetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    await cargarUsuarios();
    await cargarMedicos();
  };

  const generarPacientes = async event => {
    event.preventDefault();
    await authFetch('/api/pacientes/generar', {
      method: 'POST',
      body: JSON.stringify({ cantidad: Number(cantidad) })
    });
    await cargarPacientes();
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
        <button onClick={logout}>Salir</button>
      </header>

      <nav className="tabs">
        {tabs.map(item => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      {msg && <p className="error app-message">{msg}</p>}

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
              <select value={citaForm.id_paciente} onChange={e => setCitaForm({ ...citaForm, id_paciente: e.target.value })}>
                <option value="">Paciente</option>
                {pacientes.map(paciente => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nombre} {paciente.apellidos}
                  </option>
                ))}
              </select>
              <select value={citaForm.id_medico} onChange={e => setCitaForm({ ...citaForm, id_medico: e.target.value })}>
                <option value="">Medico</option>
                {medicos.map(medico => (
                  <option key={medico.id} value={medico.id}>
                    {medico.nombre}{medico.especialidad ? ` - ${medico.especialidad}` : ''}
                  </option>
                ))}
              </select>
              <input type="datetime-local" value={citaForm.fecha_hora} onChange={e => setCitaForm({ ...citaForm, fecha_hora: e.target.value })} />
              <input placeholder="Motivo" value={citaForm.motivo} onChange={e => setCitaForm({ ...citaForm, motivo: e.target.value })} />
              <input type="number" min="5" value={citaForm.duracion_minutos} onChange={e => setCitaForm({ ...citaForm, duracion_minutos: e.target.value })} />
              <button>{citaEditando ? 'Guardar cambios' : 'Crear cita'}</button>
              {citaEditando && <button type="button" className="danger" onClick={cancelarEdicionCita}>Cancelar edicion</button>}
            </form>
          )}
          <div className="list">
            {citas.map(cita => (
              <article className="item" key={cita.id}>
                <strong>#{cita.id} {cita.paciente_nombre} {cita.paciente_apellidos}</strong>
                <span>{cita.medico_nombre} · {new Date(cita.fecha_hora).toLocaleString()} · {cita.estado}</span>
                <span>{cita.motivo}</span>
                <div className="row">
                  {usuario.rol === 'medico' && cita.estado === 'pendiente' && <button onClick={() => cambiarEstado(cita.id, 'en curso')}>En curso</button>}
                  {usuario.rol === 'medico' && cita.estado === 'en curso' && <button onClick={() => abrirFinalizacion(cita)}>Finalizada</button>}
                  {(usuario.rol === 'recepcionista' || usuario.rol === 'administrador') && ['pendiente', 'cancelada'].includes(cita.estado) && <button onClick={() => editarCita(cita)}>Editar</button>}
                  {(usuario.rol === 'recepcionista' || usuario.rol === 'administrador') && cita.estado === 'pendiente' && <button className="danger" onClick={() => cancelarCita(cita.id)}>Cancelar</button>}
                  {usuario.rol === 'administrador' && <button className="danger" onClick={() => eliminarCita(cita.id)}>Eliminar</button>}
                </div>
                {usuario.rol === 'medico' && citaCerrando === cita.id && (
                  <form className="clinical-form" onSubmit={event => guardarFinalizacion(event, cita)}>
                    <h3>Cierre de cita</h3>
                    <input
                      placeholder="Diagnostico"
                      required
                      value={finalizacionForm.diagnostico}
                      onChange={e => setFinalizacionForm({ ...finalizacionForm, diagnostico: e.target.value })}
                    />
                    <input
                      placeholder="Tratamiento"
                      required
                      value={finalizacionForm.tratamiento}
                      onChange={e => setFinalizacionForm({ ...finalizacionForm, tratamiento: e.target.value })}
                    />
                    <textarea
                      placeholder="Observaciones"
                      required
                      value={finalizacionForm.observaciones}
                      onChange={e => setFinalizacionForm({ ...finalizacionForm, observaciones: e.target.value })}
                    />
                    <div className="row">
                      <button>Guardar historial y finalizar</button>
                      <button type="button" className="danger" onClick={cancelarFinalizacion}>Cancelar</button>
                    </div>
                  </form>
                )}
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
          {historial?.paciente && (
            <article className="item">
              <strong>{historial.paciente.nombre_completo}</strong>
              <span>Paciente #{historial.paciente.id}</span>
              {usuario.rol === 'administrador' && <button className="danger" onClick={() => borrarHistorial(historial.paciente.id)}>Borrar historial</button>}
            </article>
          )}
          <div className="list">
            {historial?.entradas?.map((entrada, index) => (
              <article className="item" key={`${entrada.fecha}-${index}`}>
                <strong>{new Date(entrada.fecha).toLocaleString()} · {entrada.medico?.nombre_completo || `medico #${entrada.id_medico}`}</strong>
                {entrada.medico?.especialidad && <span>Especialidad: {entrada.medico.especialidad}</span>}
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
            <input placeholder={usuarioEditando ? 'Nueva password opcional' : 'Password'} type="password" value={usuarioForm.password} onChange={e => setUsuarioForm({ ...usuarioForm, password: e.target.value })} />
            <select value={usuarioForm.rol} disabled={usuarioEditando === usuario.id} onChange={e => setUsuarioForm({ ...usuarioForm, rol: e.target.value })}>
              <option value="medico">Medico</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="administrador">Administrador</option>
            </select>
            {usuarioForm.rol === 'medico' && <input placeholder="Especialidad" value={usuarioForm.especialidad} onChange={e => setUsuarioForm({ ...usuarioForm, especialidad: e.target.value })} />}
            <button>{usuarioEditando ? 'Guardar usuario' : 'Crear usuario'}</button>
            {usuarioEditando && <button type="button" className="danger" onClick={cancelarEdicionUsuario}>Cancelar edicion</button>}
          </form>
          <div className="list">
            {usuarios.map(user => (
              <article className="item" key={user.id}>
                <strong>#{user.id} {user.nombre}</strong>
                <span>{user.email} · {user.rol}{user.especialidad ? ` · ${user.especialidad}` : ''}</span>
                <div className="row">
                  <button onClick={() => editarUsuario(user)}>Editar</button>
                  {user.id !== usuario.id && <button className="danger" onClick={() => eliminarUsuario(user.id)}>Borrar</button>}
                </div>
              </article>
            ))}
          </div>
          <form onSubmit={generarPacientes} className="inline">
            <input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} />
            <button>Generar pacientes</button>
          </form>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
