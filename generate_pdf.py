import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#71717A"))
        
        # Suppress header/footer on title page if page 1
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 11 * 72 - 36, "Lean Construction — Attendance Management System Documentation")
            self.setStrokeColor(colors.HexColor("#E4E4E7"))
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)
            
            # Footer
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * 72 - 54, 36, page_text)
            self.drawString(54, 36, "Confidential — Project Technical Documentation")
            self.line(54, 48, 8.5 * 72 - 54, 48)
            
        self.restoreState()

def build_pdf(filename="Lean_Construction_Attendance_Documentation.pdf"):
    pdf_path = os.path.join(os.getcwd(), filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#09090B")
    accent_color = colors.HexColor("#2563EB")
    body_color = colors.HexColor("#18181B")
    sub_color = colors.HexColor("#52525B")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=sub_color,
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=primary_color,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=accent_color,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=body_color,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F8FAFC"),
        borderColor=colors.HexColor("#E2E8F0"),
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=8,
        spaceBefore=4
    )

    callout_style = ParagraphStyle(
        'DocCallout',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        backColor=colors.HexColor("#EFF6FF"),
        borderColor=colors.HexColor("#BFDBFE"),
        borderWidth=0.5,
        borderPadding=8,
        spaceAfter=10,
        spaceBefore=6
    )

    story = []

    # Header / Title Block
    story.append(Paragraph("Lean Construction Attendance System", title_style))
    story.append(Paragraph("Full Technical Architecture, Database Design & Integration Documentation", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=15))

    # Meta Info Table
    meta_data = [
        [Paragraph("<b>Project:</b> Lean Construction Module 1", body_style), Paragraph("<b>Database:</b> Supabase (PostgreSQL 17)", body_style)],
        [Paragraph("<b>Frontend:</b> React (Vite) + Vanilla CSS", body_style), Paragraph("<b>Hardware:</b> ESP32 + R307 Fingerprint Sensor", body_style)],
        [Paragraph("<b>Hosting:</b> Vercel (Web) + Supabase Edge", body_style), Paragraph("<b>Status:</b> Fully Built & Verified", body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F4F4F5")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Section 1: Executive Summary
    story.append(Paragraph("1. Executive Summary & Problem Overview", h1_style))
    story.append(Paragraph(
        "Traditional construction site attendance relies on manual paper registers or basic supervisor roll calls. "
        "This legacy approach causes proxy attendance (buddy punching), delayed reporting to contractors, payroll disputes, "
        "and zero real-time visibility into active on-site workforce numbers.", body_style
    ))
    story.append(Paragraph(
        "<b>The Solution:</b> An integrated Internet-of-Things (IoT) biometric attendance ecosystem. "
        "Workers scan their fingerprint at the site gate via an ESP32 microcontroller with an R307 optical fingerprint sensor. "
        "The hardware securely transmits the scan over WiFi to a Supabase cloud database, which instantly updates "
        "role-based web dashboards (Contractor, Supervisor, Worker) hosted on Vercel via WebSocket Realtime sync.", body_style
    ))

    # Section 2: Technology Stack
    story.append(Paragraph("2. Complete Technology Stack", h1_style))
    tech_data = [
        [Paragraph("<b>Layer</b>", body_style), Paragraph("<b>Technologies Used</b>", body_style), Paragraph("<b>Purpose</b>", body_style)],
        [Paragraph("<b>Frontend UI</b>", body_style), Paragraph("React (Vite), HTML5, Modern Vanilla CSS", body_style), Paragraph("Responsive web portal for Contractors, Supervisors, and Workers.", body_style)],
        [Paragraph("<b>Database</b>", body_style), Paragraph("Supabase PostgreSQL 17", body_style), Paragraph("Relational cloud DB with Row Level Security (RLS) & triggers.", body_style)],
        [Paragraph("<b>Authentication</b>", body_style), Paragraph("Supabase Auth (GoTrue API)", body_style), Paragraph("Secure email/password authentication & JWT session management.", body_style)],
        [Paragraph("<b>Backend API</b>", body_style), Paragraph("Supabase Edge Functions (Deno Runtime)", body_style), Paragraph("Serverless HTTP relay for ESP32 hardware authentication & check-in logic.", body_style)],
        [Paragraph("<b>Hardware</b>", body_style), Paragraph("ESP32 Board, R307 Optical Sensor, C++", body_style), Paragraph("On-site physical fingerprint scanner & WiFi HTTP client.", body_style)],
        [Paragraph("<b>Deployment</b>", body_style), Paragraph("Vercel (Frontend), Supabase Cloud, GitHub", body_style), Paragraph("Continuous deployment & version control.", body_style)]
    ]
    tech_table = Table(tech_data, colWidths=[90, 180, 234])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#09090B")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    # Change text color of header row in paragraphs
    for i in range(3):
        tech_data[0][i] = Paragraph(f"<font color='white'><b>{['Layer', 'Technologies Used', 'Purpose'][i]}</b></font>", body_style)
    story.append(tech_table)
    story.append(Spacer(1, 10))

    # Section 3: Why Supabase instead of Firebase?
    story.append(Paragraph("3. Architectural Choice: Why Supabase Over Firebase?", h1_style))
    story.append(Paragraph(
        "Selecting the right backend was a critical architectural decision. Here is why Supabase (PostgreSQL) "
        "was chosen over Google Firebase (Firestore NoSQL):", body_style
    ))
    
    reasons = [
        ("Relational Data Structure (PostgreSQL vs. NoSQL Document Store)",
         "Attendance data is strictly relational: <i>Workers</i> have multiple <i>Attendance Logs</i>, which belong to specific <i>Sites</i> and <i>Roles</i>. "
         "Postgres handles foreign keys, SQL joins, and relational integrity natively. Firebase Firestore relies on flat NoSQL collections, "
         "forcing redundant data duplication and expensive client-side joins."),
        
        ("Postgres Row-Level Security (RLS) vs. Firebase Security Rules",
         "Supabase leverages native PostgreSQL RLS policies defined directly at the database engine level. "
         "Even if a malicious user inspects network traffic and extracts the API keys, the database itself enforces that a worker can ONLY query rows where <code>user_id = auth.uid()</code>."),
        
        ("Automated Database Triggers & Stored Procedures",
         "Supabase allows writing SQL triggers directly inside Postgres (e.g., auto-calculating <code>present</code> vs <code>late</code> status on insert based on 9 AM cutoff). "
         "Firebase requires running separate Cloud Functions for every trigger, adding extra latency and complexity."),
        
        ("No Vendor Lock-In & Open Standard SQL",
         "Supabase is built on standard open-source PostgreSQL. If needed, the entire database can be exported as a standard <code>.sql</code> file and hosted anywhere (AWS RDS, GCP Cloud SQL, or self-hosted Docker). Firebase locks your application into proprietary Google APIs.")
    ]

    for title, desc in reasons:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 10))

    # Section 4: Database Design & Tables
    story.append(Paragraph("4. Database Schema & Table Structure", h1_style))
    story.append(Paragraph(
        "The database schema consists of two core relational tables created in Supabase PostgreSQL:", body_style
    ))

    # Users Table
    story.append(Paragraph("Table A: <code>public.users</code>", h2_style))
    users_schema = [
        [Paragraph("<b>Column</b>", body_style), Paragraph("<b>Type</b>", body_style), Paragraph("<b>Constraints / Notes</b>", body_style)],
        [Paragraph("<code>id</code>", body_style), Paragraph("<code>uuid (PK)</code>", body_style), Paragraph("References <code>auth.users(id)</code> ON DELETE CASCADE", body_style)],
        [Paragraph("<code>full_name</code>", body_style), Paragraph("<code>text</code>", body_style), Paragraph("Worker / Contractor / Supervisor full name", body_style)],
        [Paragraph("<code>role</code>", body_style), Paragraph("<code>text</code>", body_style), Paragraph("CHECK (role IN ('contractor', 'supervisor', 'worker'))", body_style)],
        [Paragraph("<code>fingerprint_id</code>", body_style), Paragraph("<code>integer</code>", body_style), Paragraph("UNIQUE constraint. Maps to numeric slot on R307 sensor", body_style)],
        [Paragraph("<code>created_at</code>", body_style), Paragraph("<code>timestamptz</code>", body_style), Paragraph("DEFAULT <code>now()</code>", body_style)],
    ]
    u_table = Table(users_schema, colWidths=[110, 100, 294])
    u_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(u_table)
    story.append(Spacer(1, 8))

    # Attendance Table
    story.append(Paragraph("Table B: <code>public.attendance</code>", h2_style))
    att_schema = [
        [Paragraph("<b>Column</b>", body_style), Paragraph("<b>Type</b>", body_style), Paragraph("<b>Constraints / Notes</b>", body_style)],
        [Paragraph("<code>id</code>", body_style), Paragraph("<code>uuid (PK)</code>", body_style), Paragraph("DEFAULT <code>gen_random_uuid()</code>", body_style)],
        [Paragraph("<code>user_id</code>", body_style), Paragraph("<code>uuid (FK)</code>", body_style), Paragraph("References <code>public.users(id)</code> ON DELETE CASCADE", body_style)],
        [Paragraph("<code>check_in</code>", body_style), Paragraph("<code>timestamptz</code>", body_style), Paragraph("Timestamp when worker scanned finger at entry", body_style)],
        [Paragraph("<code>check_out</code>", body_style), Paragraph("<code>timestamptz</code>", body_style), Paragraph("Nullable. Filled when worker scans finger at exit", body_style)],
        [Paragraph("<code>status</code>", body_style), Paragraph("<code>text</code>", body_style), Paragraph("Auto-derived by trigger: 'present' or 'late'", body_style)],
        [Paragraph("<code>device_id</code>", body_style), Paragraph("<code>text</code>", body_style), Paragraph("Identifies which ESP32 scanner sent the log", body_style)],
    ]
    a_table = Table(att_schema, colWidths=[110, 100, 294])
    a_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(a_table)
    story.append(Spacer(1, 10))

    # Section 5: Automated Triggers & SQL Logic
    story.append(Paragraph("5. Automated Database Triggers", h1_style))
    story.append(Paragraph(
        "To keep business logic consistent and reduce client-side code, two SQL triggers were created:", body_style
    ))

    trigger_code = """-- Trigger 1: Auto-derive 'present' vs 'late' status based on 9 AM IST cutoff
CREATE OR REPLACE FUNCTION public.derive_attendance_status()
RETURNS TRIGGER AS $$
BEGIN
  IF EXTRACT(HOUR FROM NEW.check_in AT TIME ZONE 'Asia/Kolkata') < 9 THEN
    NEW.status := 'present';
  ELSE
    NEW.status := 'late';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_derive_attendance_status
  BEFORE INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.derive_attendance_status();

-- Trigger 2: Auto-create public.users row on Auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();"""
    
    story.append(Paragraph(trigger_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
    story.append(Spacer(1, 10))

    # Section 6: Data Flow & Realtime Architecture
    story.append(Paragraph("6. End-to-End Data Flow (Hardware ➔ Cloud ➔ Web)", h1_style))
    story.append(Paragraph(
        "Here is step-by-step how a physical scan on the construction site updates the web portal in real time:", body_style
    ))

    flow_steps = [
        ("Step 1: Physical Fingerprint Scan", "Worker places finger on R307 optical sensor connected to ESP32 at site gate. The sensor matches the fingerprint template and returns numeric slot (e.g., ID 1)."),
        ("Step 2: HTTP POST to Edge Function Relay", "ESP32 sends JSON payload <code>{ fingerprint_id: 1, device_secret: '...' }</code> over WiFi to Supabase Edge Function <code>attendance-relay</code>."),
        ("Step 3: Serverless Business Logic", "Edge Function validates device secret, looks up worker UUID from <code>users</code> table, checks if check-in exists for today:<br/>"
                                              "• <b>No entry today:</b> INSERTS new check-in row (Trigger sets status = 'present' or 'late').<br/>"
                                              "• <b>Checked in, check_out IS NULL:</b> UPDATES row with <code>check_out = now()</code>.<br/>"
                                              "• <b>Already checked out:</b> Returns response 'Already checked out today'."),
        ("Step 4: Supabase Realtime Publication", "PostgreSQL publishes the INSERT/UPDATE mutation to the <code>supabase_realtime</code> channel over WebSockets."),
        ("Step 5: React UI Dynamic Render", "React web portal subscription catches event instantly and updates stats cards & attendance tables without page refresh.")
    ]

    for title, desc in flow_steps:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 10))

    # Section 7: How Data is Fetched in React
    story.append(Paragraph("7. How Frontend Fetches & Listens to Supabase Data", h1_style))
    story.append(Paragraph(
        "The React web application uses `@supabase/supabase-js` client to fetch initial data and subscribe to WebSocket changes:", body_style
    ))

    react_code = """// 1. Initial Data Fetch (Contractor & Supervisor Dashboards)
const [attendanceRes, usersRes] = await Promise.all([
  supabase.from("attendance").select("*").order("check_in", { ascending: false }),
  supabase.from("users").select("*").eq("role", "worker")
]);

// 2. Realtime WebSocket Listener (Updates UI live on hardware scan)
useEffect(() => {
  const channel = supabase
    .channel("attendance-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "attendance" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          setAttendance((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setAttendance((prev) => prev.map((a) => a.id === payload.new.id ? payload.new : a));
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);"""

    story.append(Paragraph(react_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
    story.append(Spacer(1, 10))

    # Section 8: Hardware & Firmware Specs
    story.append(Paragraph("8. Hardware Specifications & Sensor Wiring", h1_style))
    story.append(Paragraph(
        "The hardware module consists of an ESP32 Wi-Fi microcontroller connected to an R307 Optical Fingerprint Sensor.", body_style
    ))

    wiring_data = [
        [Paragraph("<b>R307 Wire Color</b>", body_style), Paragraph("<b>Function</b>", body_style), Paragraph("<b>ESP32 Pin Connection</b>", body_style)],
        [Paragraph("🔴 Red", body_style), Paragraph("Power (VCC)", body_style), Paragraph("3.3V (or 5V)", body_style)],
        [Paragraph("🖤 Black", body_style), Paragraph("Ground (GND)", body_style), Paragraph("GND", body_style)],
        [Paragraph("🟢 Green", body_style), Paragraph("Serial Receive (RX)", body_style), Paragraph("GPIO 16 (RX2)", body_style)],
        [Paragraph("⚪ White", body_style), Paragraph("Serial Transmit (TX)", body_style), Paragraph("GPIO 17 (TX2)", body_style)],
    ]
    w_table = Table(wiring_data, colWidths=[130, 170, 204])
    w_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(w_table)
    story.append(Spacer(1, 15))

    # Section 9: Conclusion
    story.append(Paragraph("9. Conclusion & Next Steps (Module 2+)", h1_style))
    story.append(Paragraph(
        "Module 1 successfully establishes a complete end-to-end attendance pipeline: physical fingerprint scan ➔ "
        "ESP32 transmission ➔ Supabase Edge authentication ➔ PostgreSQL relational trigger processing ➔ "
        "Vercel React Realtime web dashboard updates.<br/><br/>"
        "<b>Upcoming Enhancements for Module 2:</b><br/>"
        "• <b>Automated End-of-Day Absentee Cron Job:</b> Supabase scheduled Edge Function to mark non-checked-in workers as absent.<br/>"
        "• <b>Remote Over-The-Air Fingerprint Registration:</b> Enabling supervisors to put the ESP32 into enrollment mode directly from the web app.<br/>"
        "• <b>Construction Site Scoping (site_id):</b> Supporting multiple active construction sites under a single contractor account.", body_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at: {pdf_path}")

if __name__ == "__main__":
    build_pdf()
