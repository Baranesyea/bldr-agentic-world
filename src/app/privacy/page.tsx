export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a1a", color: "#f0f0f5",
      padding: "48px 24px", direction: "rtl",
    }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
          מדיניות פרטיות
        </h1>
        <p style={{ color: "rgba(240,240,245,0.4)", fontSize: "13px", marginBottom: "48px" }}>
          עדכון אחרון: מרץ 2026
        </p>

        <Section title="1. מבוא">
          ברוכים הבאים לפלטפורמת BLDR. פרטיותכם חשובה לנו. מסמך זה מסביר אילו מידע אנו אוספים, כיצד אנו משתמשים בו וכיצד אנו מגנים עליו.
        </Section>

        <Section title="2. המידע שאנו אוספים">
          <ul style={{ paddingRight: "20px", lineHeight: 2 }}>
            <li>שם מלא, כתובת אימייל ומספר טלפון — בעת הרשמה</li>
            <li>מידע על פעילותכם בפלטפורמה (שיעורים שצפיתם, התקדמות)</li>
            <li>מידע טכני: דפדפן, מערכת הפעלה, כתובת IP</li>
          </ul>
        </Section>

        <Section title="3. כיצד אנו משתמשים במידע">
          <ul style={{ paddingRight: "20px", lineHeight: 2 }}>
            <li>לאפשר גישה לתכנים שנשלחו אליכם</li>
            <li>לשלוח עדכונים על תכנים חדשים, מבצעים ועדכוני מערכת</li>
            <li>לשפר את חוויית המשתמש ולנתח שימוש בפלטפורמה</li>
          </ul>
        </Section>

        <Section title="4. שיתוף מידע עם צדדים שלישיים">
          אנו לא מוכרים, מסחרים או מעבירים מידע אישי לצדדים שלישיים ללא הסכמתכם, למעט ספקי שירות הפועלים מטעמנו (כגון: שירותי אימייל ותשלום).
        </Section>

        <Section title="5. אבטחת מידע">
          אנו מיישמים אמצעי אבטחה סבירים להגנה על המידע האישי שלכם מפני גישה, שינוי, חשיפה או מחיקה לא מורשים.
        </Section>

        <Section title="6. זכויותיכם">
          <ul style={{ paddingRight: "20px", lineHeight: 2 }}>
            <li>הזכות לעיין במידע שנאסף עליכם</li>
            <li>הזכות לתקן מידע לא מדויק</li>
            <li>הזכות למחוק את חשבונכם והמידע הקשור אליו</li>
            <li>הזכות לבטל הסכמה לקבלת תקשורת שיווקית</li>
          </ul>
        </Section>

        <Section title="7. עוגיות (Cookies)">
          אנו משתמשים בעוגיות לניהול ההתחברות לפלטפורמה ולשיפור חוויית המשתמש. ניתן לנהל הגדרות עוגיות דרך הגדרות הדפדפן שלכם.
        </Section>

        <Section title="8. יצירת קשר">
          לכל שאלה בנושא הפרטיות, ניתן לפנות אלינו בכתובת: privacy@bldr.co.il
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "36px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>
        {title}
      </h2>
      <div style={{ fontSize: "15px", color: "rgba(240,240,245,0.65)", lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}
