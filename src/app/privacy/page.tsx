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
          תאריך עדכון אחרון: 17.10.2025
        </p>

        <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.65)", lineHeight: 1.8, marginBottom: "36px" }}>
          ברוכים הבאים לפלטפורמת <strong style={{ color: "#fff" }}>BLDR</strong> (להלן: "הפלטפורמה"). אנו מחויבים לשמירה על פרטיות המידע האישי של המשתמשים ופועלים בהתאם לחוק הגנת הפרטיות, התשמ"א–1981, ולתיקון 13 לחוק, החל מיום 14 באוגוסט 2025.
        </p>

        <Section title="סוגי המידע שנאסף">
          <p style={{ marginBottom: 8 }}>בעת השימוש בפלטפורמה אנו עשויים לאסוף את המידע הבא:</p>
          <ul style={{ paddingRight: "20px", lineHeight: 2 }}>
            <li>מידע שמוזן ישירות על ידי המשתמשים דרך טפסי הרשמה, הצטרפות או יצירת קשר (שם, טלפון, כתובת דוא"ל ותוכן ההודעה).</li>
            <li>נתונים טכניים הדרושים לפעילות הפלטפורמה, כגון כתובת IP, סוג דפדפן, מערכת הפעלה, שפה ואזור.</li>
            <li>מידע על פעילותכם בפלטפורמה (שיעורים שצפיתם, התקדמות, נתוני שימוש).</li>
            <li>מידע הנאסף באמצעות עוגיות (Cookies), טכנולוגיות מעקב וכלי ניתוח שימוש.</li>
          </ul>
        </Section>

        <Section title="מטרות השימוש במידע">
          <ul style={{ paddingRight: "20px", lineHeight: 2 }}>
            <li>מתן גישה לתכנים שנשלחו אליכם ואפשור שימוש בפלטפורמה.</li>
            <li>מענה לפניות ומתן שירות ללקוחות ולמתעניינים.</li>
            <li>שיפור חוויית המשתמש בפלטפורמה והתאמתה להעדפות המשתמש.</li>
            <li>ניתוח ביצועים ותנועת גולשים לצורך אופטימיזציה של תוכן ושירותים.</li>
            <li>שליחת עדכונים על תכנים חדשים, מבצעים ועדכוני מערכת.</li>
            <li>עמידה בהוראות החוק ובדרישות רגולטוריות.</li>
          </ul>
        </Section>

        <Section title="קובצי Cookie">
          בעת ביקורכם בפלטפורמה, ייתכן שיוצבו קובצי Cookie במחשב או במכשיר שבו אתם משתמשים. קובצי Cookie מאפשרים לפלטפורמה לזהות את המכשיר בביקורים חוזרים, לשמור העדפות ולשפר את חוויית הגלישה. המשתמשים יכולים לנהל את הגדרות ה־Cookie בדפדפן שלהם, ולבחור אם לאפשר או לחסום סוגים מסוימים של קובצי Cookie. חסימה של חלקם עלולה להשפיע על פעולת חלק מהפונקציות בפלטפורמה.
        </Section>

        <Section title="Google Analytics">
          <p>הפלטפורמה עושה שימוש בשירות Google Analytics לצורך ניתוח ושיפור חוויית המשתמש.</p>
          <p style={{ marginTop: 8 }}>ניתן למנוע מ־Google Analytics לאסוף מידע באמצעות תוסף דפדפן ייעודי לביטול הסכמה.</p>
        </Section>

        <Section title="וידג'טים ורשתות חברתיות">
          הפלטפורמה עשויה לכלול קישורים ואלמנטים אינטראקטיביים מרשתות חברתיות (כגון TikTok, LinkedIn, Facebook, Instagram ו־YouTube). פלטפורמות אלה עשויות לאסוף מידע על פעילותכם בהתאם למדיניות הפרטיות שלהן.
        </Section>

        <Section title="ילדים">
          הפלטפורמה אינה מיועדת לילדים מתחת לגיל 13, ואיננו אוספים ביודעין מידע אישי עליהם.
        </Section>

        <Section title="העברת מידע לצדדים שלישיים">
          <p>המידע האישי לא יימכר או יועבר לצדדים שלישיים, למעט במקרים הבאים:</p>
          <ul style={{ paddingRight: "20px", lineHeight: 2, marginTop: 8 }}>
            <li>כאשר הדבר נדרש על פי דין.</li>
            <li>כאשר הדבר נדרש לצורך תפעול הפלטפורמה או מתן שירות, בכפוף להתחייבות לשמירה על פרטיות המידע.</li>
          </ul>
        </Section>

        <Section title="אבטחת מידע">
          הפלטפורמה פועלת באמצעי אבטחה מתקדמים, לרבות חיבור מאובטח (HTTPS), עדכוני מערכת שוטפים, והגבלת גישה למידע אישי אך ורק למורשים לכך. עם זאת, אין ביכולתנו להבטיח הגנה מוחלטת.
        </Section>

        <Section title="שמירת מידע ומחיקתו">
          המידע האישי יישמר לפרק הזמן הנדרש למטרות שלשמן נאסף, ולאחר מכן יימחק באופן מאובטח. המשתמש רשאי לבקש לעיין במידע, לתקן או למחוק אותו בכל עת.
        </Section>

        <Section title="זכויות המשתמש">
          <p>בהתאם לחוק הגנת הפרטיות ולתיקון 13, המשתמש זכאי:</p>
          <ul style={{ paddingRight: "20px", lineHeight: 2, marginTop: 8 }}>
            <li>לעיין במידע שנשמר עליו.</li>
            <li>לבקש את תיקונו או מחיקתו.</li>
            <li>לבקש להפסיק שימוש במידע למטרות שיווק.</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            לפניות בנושא זה ניתן ליצור קשר בדוא"ל:{" "}
            <a href="mailto:privacy@bldr.co.il" style={{ color: "#7777ff" }}>privacy@bldr.co.il</a>
          </p>
        </Section>

        <Section title="איסוף לידים וניהול אוטומציות">
          <p>הפלטפורמה עושה שימוש במערכות חיצוניות לניהול פניות ואוטומציות לצורך מתן שירות, שיפור תהליכים ותיעוד תקשורת עם לקוחות:</p>
          <ul style={{ paddingRight: "20px", lineHeight: 2, marginTop: 8 }}>
            <li><strong style={{ color: "#fff" }}>Make (Integromat)</strong> – פלטפורמה לאוטומציות מאובטחות בין מערכות שונות.</li>
            <li><strong style={{ color: "#fff" }}>רב־מסר</strong> – מערכת לשליחת הודעות דוא"ל ו־SMS.</li>
            <li><strong style={{ color: "#fff" }}>ManyChat ו־Green API</strong> – מערכות לשליחת הודעות WhatsApp.</li>
          </ul>
          <p style={{ marginTop: 8 }}>כל המידע המועבר למערכות אלה נשמר באופן מאובטח, אינו נמכר לצדדים שלישיים, ומשמש אך ורק לצורך מתן שירות.</p>
        </Section>

        <Section title="קישורים לאתרים אחרים">
          הפלטפורמה עשויה להכיל קישורים לאתרים חיצוניים שאינם מופעלים על ידינו. השימוש באתרים אלו כפוף למדיניות הפרטיות של אותם אתרים בלבד.
        </Section>

        <Section title="יצירת קשר">
          <p>לכל שאלה בנושא הפרטיות, ניתן לפנות אלינו:</p>
          <p style={{ marginTop: 8 }}>
            דוא"ל:{" "}
            <a href="mailto:privacy@bldr.co.il" style={{ color: "#7777ff" }}>privacy@bldr.co.il</a>
          </p>
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
