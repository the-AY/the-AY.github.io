import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from src.resume_parser import ResumeParser
from src.job_search import JobSearcher

# ... (Previous CSS remains same)

def show_ats_scanner():
    st.title("📄 ATS Resume Scanner")
    st.subheader("Analyze your resume against industry standards")
    
    uploaded_file = st.file_uploader("Upload your Resume (PDF)", type=["pdf"])
    
    if uploaded_file is not None:
        with st.spinner("Analyzing Resume..."):
            parser = ResumeParser()
            text = parser.extract_text_from_pdf(uploaded_file)
            
            if "Error" in text:
                st.error("Could not parse PDF. Please ensure it is not text-locked or encrypted.")
                return

            analysis = parser.analyze_resume(text)
            
            # Store in session state for Job Search
            if 'skills' in analysis:
                st.session_state['extracted_skills'] = analysis['skills']
                st.toast(f"Extracted {len(analysis['skills'])} skills for Job Search!", icon="✅")
            
            # Display Score
            st.markdown("---")
            col1, col2 = st.columns([1, 2])
            
            with col1:
                # Gauge Chart
                fig = go.Figure(go.Indicator(
                    mode = "gauge+number",
                    value = analysis['score'],
                    domain = {'x': [0, 1], 'y': [0, 1]},
                    title = {'text': "ATS Score"},
                    gauge = {
                        'axis': {'range': [0, 100]},
                        'bar': {'color': "#4CAF50" if analysis['score'] >= 70 else "#ff9800" if analysis['score'] >= 50 else "#f44336"},
                        'steps': [
                            {'range': [0, 50], 'color': "rgba(255, 255, 255, 0.1)"},
                            {'range': [50, 70], 'color': "rgba(255, 255, 255, 0.3)"},
                            {'range': [70, 100], 'color': "rgba(255, 255, 255, 0.5)"}
                        ]
                    }
                ))
                fig.update_layout(paper_bgcolor = "rgba(0,0,0,0)", font = {'color': "white"}, height=300)
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.write("### Analysis Summary")
                for feedback in analysis['summary_feedback']:
                    if "CRITICAL" in feedback:
                        st.error(feedback)
                    elif "WARNING" in feedback:
                        st.warning(feedback)
                    elif "SUCCESS" in feedback:
                        st.success(feedback)
                    else:
                        st.info(feedback)
            
            # Detailed Breakdown
            st.markdown("### 🔍 Detailed Breakdown")
            
            c1, c2, c3 = st.columns(3)
            with c1:
                st.metric("Contact Info", f"{sum(1 for v in analysis['contact_info'].values() if v)} Found")
                if not analysis['contact_info']['email']: st.write("❌ Email Missing")
                if not analysis['contact_info']['phone']: st.write("❌ Phone Missing")
                if not analysis['contact_info']['linkedin']: st.write("⚠️ LinkedIn Missing")
            
            with c2:
                st.metric("Word Count", analysis['word_count'])
                if analysis['word_count'] < 200: st.caption("Too Short")
                elif analysis['word_count'] > 1000: st.caption("Too Long")
                else: st.caption("Optimal Length")

            with c3:
                st.metric("Skills Detected", len(analysis['skills']))

            # Missing Section
            if analysis['missing_sections']:
                st.error(f"**Missing Critical Sections:** {', '.join(analysis['missing_sections'])}")
            else:
                st.success("✅ All critical sections found (Experience, Education, Skills)")

            # Skills
            st.write("### 🛠️ Skills Found")
            if analysis['skills']:
                st.write(", ".join([f"`{skill}`" for skill in analysis['skills']]))
            else:
                st.warning("No popular technical skills found. Try using standard keywords.")


def show_job_search():
    st.title("🔍 Intelligent Job Search")
    st.subheader("Aggregator & Smart Links")
    
    col1, col2 = st.columns(2)
    with col1:
        role = st.text_input("Job Role", "Python Developer")
        location = st.text_input("Location", "Remote")
    
    with col2:
        # Auto-fill skills if available
        default_skills = st.session_state.get('extracted_skills', [])
        skills_input = st.text_input("Top Skills (comma separated)", ", ".join(default_skills))
        skills_list = [s.strip() for s in skills_input.split(',')] if skills_input else []

    if st.button("Search Jobs", type="primary"):
        searcher = JobSearcher()
        
        # 1. Smart Links
        st.markdown("### 🌐 One-Click Smart Searches")
        st.write("These links use optimized Boolean operators based on your skills.")
        
        links = searcher.generate_smart_links(role, location, skills_list)
        
        cols = st.columns(len(links))
        for i, link in enumerate(links):
            with cols[i]:
                st.link_button(f"🔎 {link['name']}", link['url'])

        # 2. RSS Aggregator
        st.markdown("---")
        st.markdown("### 📡 Live Feed Jobs (Remote/Tech)")
        with st.spinner("Fetching latest jobs from feeds..."):
            df = searcher.fetch_rss_jobs(role)
            
            if not df.empty:
                st.dataframe(
                    df,
                    column_config={
                        "Link": st.column_config.LinkColumn("Apply Link")
                    },
                    hide_index=True,
                    use_container_width=True
                )
                
                # Export
                csv = df.to_csv(index=False).encode('utf-8')
                st.download_button(
                    "📥 Download Results as CSV",
                    csv,
                    "job_results.csv",
                    "text/csv",
                    key='download-csv'
                )
            else:
                st.warning("No matching jobs found in RSS feeds. Try a broader term or check Smart Links above.")

if __name__ == "__main__":
    main()
