"""
Página de Entregas e Viagens do Streamlit.
Consome os dados de Resumo de Viagens do Google Sheets ou upload manual.
"""
import streamlit as st
import pandas as pd
from comum import (
    header_html, carregar_viagens_sheets, carregar_viagens_excel, VIAGENS_CSV,
    barh, fmt, TEAL, DEEP, SALMON, GREEN
)

# Header visual
st.markdown(header_html("ENTREGAS & VIAGENS", "Performance de viagens, motoristas e entregas finalizadas"), unsafe_allow_html=True)

# Sidebar: Origem dos dados e filtros
with st.sidebar:
    st.markdown("### ⚙️ Fonte de Dados")
    modo = st.radio("Carregar viagens de:", ["Google Sheets (Nuvem)", "Upload de Arquivo (.xlsx)"], index=0)
    
    if modo == "Upload de Arquivo (.xlsx)":
        arq = st.file_uploader("Carregar planilha de viagens", type=["xlsx", "xls"])
        if arq:
            df_base = carregar_viagens_excel(arq.name, arq.getvalue())
        else:
            st.info("Usando dados do Google Sheets enquanto nenhum arquivo for enviado.")
            df_base = carregar_viagens_sheets(VIAGENS_CSV)
    else:
        df_base = carregar_viagens_sheets(VIAGENS_CSV)

if df_base is None or df_base.empty:
    st.warning("Nenhum dado de viagens encontrado.")
    st.stop()

# Filtros
df = df_base.copy()

with st.container(border=True):
    c1, c2, c3 = st.columns(3)
    with c1:
        filiais = ["Todas"] + sorted([f for f in df["Filial"].dropna().unique() if str(f).strip()]) if "Filial" in df.columns else ["Todas"]
        filial_sel = st.selectbox("Filial", filiais)
    with c2:
        motoristas = ["Todos"] + sorted([m for m in df["Motorista"].dropna().unique() if str(m).strip()]) if "Motorista" in df.columns else ["Todos"]
        motorista_sel = st.selectbox("Motorista", motoristas)
    with c3:
        busca = st.text_input("Buscar Veículo ou Filial", placeholder="Digite...")

if filial_sel != "Todas":
    df = df[df["Filial"] == filial_sel]
if motorista_sel != "Todos":
    df = df[df["Motorista"] == motorista_sel]
if busca:
    termo = busca.strip().lower()
    mascara = pd.Series(False, index=df.index)
    for col in ["Veiculo", "Filial", "Motorista"]:
        if col in df.columns:
            mascara |= df[col].astype(str).str.lower().str.contains(termo, na=False)
    df = df[mascara]

# KPIs
k1, k2, k3, k4, k5 = st.columns(5)
total_viagens = df["Viagens"].sum() if "Viagens" in df.columns else len(df)
total_entregas = df["Entregas"].sum() if "Entregas" in df.columns else 0
sucessos = df["Sucessos"].sum() if "Sucessos" in df.columns else 0
insucessos = df["Insucessos"].sum() if "Insucessos" in df.columns else 0
taxa_sucesso = (sucessos / total_entregas * 100) if total_entregas > 0 else 0

with k1:
    st.metric("Total de Viagens", f"{total_viagens:,}".replace(",", "."))
with k2:
    st.metric("Entregas Totais", f"{total_entregas:,}".replace(",", "."))
with k3:
    st.metric("Sucessos", f"{sucessos:,}".replace(",", "."))
with k4:
    st.metric("Insucessos", f"{insucessos:,}".replace(",", "."), delta=f"{(insucessos/total_entregas*100):.1f}%" if total_entregas else "0%", delta_color="inverse")
with k5:
    st.metric("Taxa de Sucesso", f"{taxa_sucesso:.1f}%")

st.markdown("---")

# Gráficos
col_g1, col_g2 = st.columns(2)
with col_g1:
    if "Filial" in df.columns and "Entregas" in df.columns and not df.empty:
        ent_filial = df.groupby("Filial")["Entregas"].sum().reset_index().sort_values("Entregas", ascending=False)
        fig_f = barh(ent_filial.head(10), x="Entregas", y="Filial", title="Entregas por Filial")
        st.plotly_chart(fig_f, use_container_width=True)

with col_g2:
    if "Motorista" in df.columns and "Sucessos" in df.columns and not df.empty:
        mot_suc = df.groupby("Motorista")["Sucessos"].sum().reset_index().sort_values("Sucessos", ascending=False)
        fig_m = barh(mot_suc.head(10), x="Sucessos", y="Motorista", title="Top Motoristas (Sucesso)", color_fixed=GREEN)
        st.plotly_chart(fig_m, use_container_width=True)

# Tabela
st.markdown("### 📋 Detalhamento das Viagens")
cols_exibir = [c for c in ["Data Entrega", "Filial", "Motorista", "Veiculo", "Viagens", "Entregas", "Sucessos", "Insucessos"] if c in df.columns]
st.dataframe(df[cols_exibir].sort_values("Entregas", ascending=False if "Entregas" in df.columns else True), use_container_width=True)

