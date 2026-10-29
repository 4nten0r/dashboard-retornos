"""
Página de Pendências do Streamlit.
Consome os dados consolidados do Google Sheets ou upload manual.
"""
import streamlit as st
import pandas as pd
from comum import (
    header_html, carregar_sheets, carregar, SHEET_CSV,
    tabela_detalhe, estilo_detalhe, barh, lbl_int, lbl_pct, lbl_rs,
    TEAL, DEEP, SALMON, AMBER, GREEN
)

# Header visual
st.markdown(header_html("PENDÊNCIAS", "Painel de controle e monitoramento de notas em aberto"), unsafe_allow_html=True)

# Sidebar: Origem dos dados e filtros
with st.sidebar:
    st.markdown("### ⚙️ Fonte de Dados")
    modo = st.radio("Carregar de:", ["Google Sheets (Nuvem)", "Upload de Arquivo (.xlsx)"], index=0)
    
    if modo == "Upload de Arquivo (.xlsx)":
        arq = st.file_uploader("Carregar planilha de pendências", type=["xlsx", "xls"])
        if arq:
            df_base = carregar(arq.name, arq.getvalue())
        else:
            st.info("Usando dados do Google Sheets enquanto nenhum arquivo for enviado.")
            df_base = carregar_sheets(SHEET_CSV)
    else:
        df_base = carregar_sheets(SHEET_CSV)

if df_base is None or df_base.empty:
    st.warning("Nenhum dado encontrado para exibição.")
    st.stop()

# Filtros
df = df_base.copy()

with st.container(border=True):
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        filiais = ["Todas"] + sorted([f for f in df["Filial"].dropna().unique() if str(f).strip()]) if "Filial" in df.columns else ["Todas"]
        filial_sel = st.selectbox("Filial", filiais)
    with c2:
        status_opts = ["Todos"] + sorted([s for s in df["Status de Entrega"].dropna().unique() if str(s).strip()]) if "Status de Entrega" in df.columns else ["Todos"]
        status_sel = st.selectbox("Status", status_opts)
    with c3:
        ocorrencias = ["Todas"] + sorted([o for o in df["Ocorrência"].dropna().unique() if str(o).strip()]) if "Ocorrência" in df.columns else ["Todas"]
        ocorrencia_sel = st.selectbox("Ocorrência", ocorrencias)
    with c4:
        busca = st.text_input("Buscar NF ou Motorista", placeholder="Digite...")

# Aplicação dos filtros
if filial_sel != "Todas":
    df = df[df["Filial"] == filial_sel]
if status_sel != "Todos":
    df = df[df["Status de Entrega"] == status_sel]
if ocorrencia_sel != "Todas":
    df = df[df["Ocorrência"] == ocorrencia_sel]
if busca:
    termo = busca.strip().lower()
    mascara = pd.Series(False, index=df.index)
    for col in ["NF", "Motorista", "Cliente", "Cidade"]:
        if col in df.columns:
            mascara |= df[col].astype(str).str.lower().str.contains(termo, na=False)
    df = df[mascara]

# KPIs
k1, k2, k3, k4, k5 = st.columns(5)
total_notas = len(df)
atrasadas = df["Atrasado"].sum() if "Atrasado" in df.columns else 0
pct_atraso = (atrasadas / total_notas * 100) if total_notas > 0 else 0
valor_total = df["Valor NF"].sum() if "Valor NF" in df.columns else 0
peso_total = df["Peso"].sum() if "Peso" in df.columns else 0

with k1:
    st.metric("Total de Notas", f"{total_notas:,}".replace(",", "."))
with k2:
    st.metric("Notas Atrasadas", f"{atrasadas:,}".replace(",", "."), delta=f"{pct_atraso:.1f}%", delta_color="inverse")
with k3:
    st.metric("Taxa no Prazo", f"{100 - pct_atraso:.1f}%")
with k4:
    st.metric("Valor Total", f"R$ {valor_total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
with k5:
    st.metric("Peso Total (kg)", f"{peso_total:,.0f}".replace(",", "."))

st.markdown("---")

# Gráficos
col_g1, col_g2 = st.columns(2)
with col_g1:
    if "Status de Entrega" in df.columns and not df.empty:
        status_cont = df["Status de Entrega"].value_counts().reset_index()
        status_cont.columns = ["Status", "Notas"]
        fig_status = barh(status_cont.head(10), x="Notas", y="Status", title="Principais Status")
        st.plotly_chart(fig_status, use_container_width=True)

with col_g2:
    if "Ocorrência" in df.columns and not df.empty:
        ocorr_cont = df["Ocorrência"].value_counts().reset_index()
        ocorr_cont.columns = ["Ocorrência", "Notas"]
        fig_ocorr = barh(ocorr_cont.head(10), x="Notas", y="Ocorrência", title="Principais Ocorrências", color_fixed=SALMON)
        st.plotly_chart(fig_ocorr, use_container_width=True)

# Tabela Detalhada
st.markdown("### 📋 Detalhamento")
tab1, tab2 = st.tabs(["Por Filial", "Por Motorista"])

with tab1:
    if "Filial" in df.columns and not df.empty:
        t_filial = tabela_detalhe(df, "Filial")
        st.dataframe(estilo_detalhe(t_filial), use_container_width=True)

with tab2:
    if "Motorista" in df.columns and not df.empty:
        t_mot = tabela_detalhe(df, "Motorista")
        st.dataframe(estilo_detalhe(t_mot), use_container_width=True)

