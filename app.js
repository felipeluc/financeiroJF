import React, { useState } from "react";
// Se quiser usar React icons/gráficos, só avisar que já incluo (mas deixei clean)
import './style.css';

const projetosDemo = [
  { id:1, titulo:"Landing Page X", descricao:"Campanha Out/2025", status:"Ideia", prazo:"05/09/2025" },
  { id:2, titulo:"App Cotas", descricao:"MVP parceiros", status:"Desenhando", prazo:"12/09/2025" },
  { id:3, titulo:"Central de Vendas", descricao:"Pipeline automatizado", status:"Em andamento", prazo:"15/10/2025" },
  { id:4, titulo:"Rebranding Y", descricao:"Nova identidade", status:"Concluído", prazo:"01/08/2025" },
];

const statusList = [
  { name: "Ideia", color: "#bbb" },
  { name: "Desenhando", color: "#888" },
  { name: "Em andamento", color: "#161616" },
  { name: "Concluído", color: "#0ab" }
];

export default function App() {
  const [projects, setProjects] = useState(projetosDemo);

  // KPIs
  const total = projects.length;
  const concluidos = projects.filter(p => p.status === 'Concluído').length;
  const andamento = projects.filter(p => p.status === 'Em andamento').length;

  return (
    <div className="app-bg">
      <div className="dashboard-container">
        <div className="dashboard-title">
          Boas-vindas ao seu Dashboard de Projetos!
        </div>
        <div className="kpi-row">
          <div className="kpi-card">
            <h2>{total}</h2>
            <span>Projetos</span>
          </div>
          <div className="kpi-card">
            <h2>{concluidos}</h2>
            <span>Concluídos</span>
          </div>
          <div className="kpi-card">
            <h2>{andamento}</h2>
            <span>Em andamento</span>
          </div>
        </div>
        {/* Gráfico simples pode ser encaixado aqui */}
        <div className="chart-area">
          {/* Use package de gráfico se quiser, aqui fica espaço para o futuro */}
          <span style={{color:"#bbb"}}>Resumo visual dos projetos (adicione gráfico, se desejar)</span>
        </div>
      </div>
      <h2 style={{margin:"32px 0 15px 8px", color:"#111"}}>Minhas Iniciativas</h2>
      <div className="board-row">
      {statusList.map(st => (
        <div className="lane-col" key={st.name}>
          <div className="lane-title" style={{color:st.color}}>{st.name}</div>
          {projects.filter(p=>p.status===st.name).map(proj=>(
            <div className="card-proj" key={proj.id} tabIndex={0}>
              <div className="card-title">{proj.titulo}</div>
              <div className="card-desc">{proj.descricao}</div>
              <div className="card-footer">
                <span>Status: <b>{proj.status}</b></span>
                <span className="data">Prazo: {proj.prazo}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
      </div>
    </div>
  )
}
