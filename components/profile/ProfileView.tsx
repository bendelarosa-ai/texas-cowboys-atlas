import Link from "next/link";
import type { Cowboy } from "@/types/cowboy";
import type { ProfileAccess, ProfileRow } from "@/lib/types";
import { classifyLink, clean, displayUrl, firstWord, joinLocation, looksLikeStreetAddress, normalizeUrl } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";

interface Props {
  cowboy: Cowboy;
  profile: ProfileRow | null;
  access: ProfileAccess;
  isSelf: boolean;
  /** Rendered inside another page (My Profile preview): demote headings one level. */
  nested?: boolean;
}

export default function ProfileView({ cowboy: c, profile: p, access, isSelf, nested = false }: Props) {
  const NameTag = nested ? "h2" : "h1";
  const SectionTag = nested ? "h3" : "h2";
  const name = clean(p?.display_name) ?? clean(c.name) ?? "Unnamed member";
  const first = firstWord(p?.preferred_name) ?? firstWord(name) ?? "This member";
  const preferred = clean(p?.preferred_name);
  const showPreferred = preferred && !name.toLowerCase().startsWith(preferred.toLowerCase());
  const title = clean(p?.role) ?? clean(c.role);
  const company = clean(p?.company) ?? clean(c.company);

  const typedLocation = clean(p?.address);
  const streetAddress = typedLocation && looksLikeStreetAddress(typedLocation) ? typedLocation : null;
  const location = (typedLocation && !streetAddress ? typedLocation : null) ?? joinLocation(c.city, c.state);

  const rosterLink = clean(c.linkedin);
  const rosterKind = rosterLink ? classifyLink(rosterLink) : null;
  const linkedin = rosterKind === "linkedin" ? rosterLink : null;
  const obituary = clean(c.obit) ?? (rosterKind === "obituary" ? rosterLink : null);
  const otherLink = rosterKind === "link" ? rosterLink : null;

  const email = clean(p?.email_contact);
  const phone = clean(p?.phone);
  const website = clean(p?.website) ?? otherLink;
  const bio = clean(p?.bio);
  const statement = clean(p?.personal_statement);

  const professional = [
    ["Title", title],
    ["Company", company],
    ["Industry", clean(c.industry)],
  ].filter(([, v]) => v) as [string, string][];

  const education = [
    ["Major", clean(c.major)],
    ["Graduate school", clean(c.grad_school)],
    ["High school", clean(c.high_school)],
    ["Organization", clean(c.org)],
  ].filter(([, v]) => v) as [string, string][];

  const hasContact = !!(email || phone || streetAddress || website || linkedin);

  return (
    <div className="space-y-6">
      {/* Notices */}
      {access === "admin" && (
        <Notice tone="amber">
          {first} hasn&rsquo;t shared this profile with members. You can see it because you&rsquo;re an admin.
        </Notice>
      )}
      {isSelf && p && !p.profile_public && (
        <Notice tone="stone">
          Your profile is private — fellow Cowboys only see your directory record.{" "}
          <Link href="/profile/edit#privacy" className="font-medium text-burnt-dark underline underline-offset-2">Share your profile</Link>
        </Notice>
      )}
      {isSelf && !p && (
        <Notice tone="stone">
          You haven&rsquo;t set up your profile yet.{" "}
          <Link href="/profile/edit" className="font-medium text-burnt-dark underline underline-offset-2">Set it up</Link> so fellow Cowboys can reach you.
        </Notice>
      )}

      {/* Header */}
      <section className="card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar name={name} src={p?.avatar_url} size="xl" muted={!!c.deceased} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {c.new_man_year && <span className="badge-burnt">New Man {c.new_man_year}</span>}
              {c.deceased && <span className="badge-neutral">In Memoriam</span>}
            </div>
            <NameTag className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-[44px]">
              {name}
            </NameTag>
            {showPreferred && <p className="text-[15px] text-stone-600">Goes by {preferred}</p>}
            {(title || company) && (
              <p className="mt-2 text-lg text-stone-800">
                {title}
                {title && company && <span className="text-stone-400"> · </span>}
                {company}
              </p>
            )}
            {location && (
              <p className="mt-1 flex items-center gap-1.5 text-[15px] text-stone-600">
                <Icon name="pin" />
                {location}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {isSelf && (
                <Link href="/profile/edit" className="btn-primary">
                  <Icon name="pencil" /> Edit profile
                </Link>
              )}
              {!isSelf && email && (
                <a href={`mailto:${email}`} className="btn-primary">
                  <Icon name="mail" /> Email {first}
                </a>
              )}
              {!isSelf && phone && (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="btn-secondary">
                  <Icon name="phone" /> Call
                </a>
              )}
              {linkedin && (
                <a href={normalizeUrl(linkedin)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  <Icon name="linkedin" /> LinkedIn
                </a>
              )}
              {website && (
                <a href={normalizeUrl(website)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  <Icon name="globe" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {access === "none" && !isSelf && (
        <Notice tone="stone">
          {first} hasn&rsquo;t shared a full profile yet. What you see here comes from the Texas Cowboys directory.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),20rem]">
        <div className="space-y-6">
          {(bio || statement) && (
            <Section as={SectionTag} title="About">
              {bio && <p className="text-lg leading-relaxed text-stone-800">{bio}</p>}
              {statement && <p className={`whitespace-pre-line leading-relaxed text-stone-700 ${bio ? "mt-4" : ""}`}>{statement}</p>}
            </Section>
          )}

          {professional.length > 0 && (
            <Section as={SectionTag} title="Professional">
              <Facts items={professional} />
            </Section>
          )}

          {education.length > 0 && (
            <Section as={SectionTag} title="Education">
              <Facts items={education} />
            </Section>
          )}

          {!bio && !statement && professional.length === 0 && education.length === 0 && (
            <div className="card px-6 py-10 text-center text-sm text-stone-600">
              {isSelf ? "Add your work and a short bio so fellow Cowboys know what you're up to." : "No further details are listed for this member yet."}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {hasContact && (
            <Section as={SectionTag} title="Contact">
              <ul className="space-y-3 text-[15px]">
                {email && <ContactRow icon="mail" href={`mailto:${email}`} text={email} />}
                {phone && <ContactRow icon="phone" href={`tel:${phone.replace(/[^\d+]/g, "")}`} text={phone} />}
                {streetAddress && <ContactRow icon="pin" text={streetAddress} />}
                {website && <ContactRow icon="globe" href={normalizeUrl(website)} text={displayUrl(website)} external />}
                {linkedin && <ContactRow icon="linkedin" href={normalizeUrl(linkedin)} text="LinkedIn profile" external />}
              </ul>
            </Section>
          )}

          <Section as={SectionTag} title="Texas Cowboys">
            <dl className="space-y-4">
              <div>
                <dt className="text-[13px] text-stone-500">New Man class</dt>
                <dd className="mt-1 font-serif text-3xl font-semibold text-stone-900">{c.new_man_year ?? "Not recorded"}</dd>
              </div>
              {c.deceased && (
                <div>
                  <dt className="text-[13px] text-stone-500">Status</dt>
                  <dd className="mt-1 text-[15px] text-stone-800">In Memoriam</dd>
                  {obituary && (
                    <a href={normalizeUrl(obituary)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-medium text-burnt-dark hover:underline">
                      Read obituary →
                    </a>
                  )}
                </div>
              )}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ as: Tag = "h2", title, children }: { as?: "h2" | "h3"; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <Tag className="section-label mb-4">{title}</Tag>
      {children}
    </section>
  );
}

function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[13px] text-stone-500">{label}</dt>
          <dd className="mt-0.5 text-[15px] text-stone-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Notice({ tone, children }: { tone: "amber" | "stone"; children: React.ReactNode }) {
  const cls = tone === "amber" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-stone-200 bg-white text-stone-700";
  return <p className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</p>;
}

function ContactRow({ icon, text, href, external }: { icon: IconName; text: string; href?: string; external?: boolean }) {
  const content = (
    <>
      <span className="mt-0.5 text-stone-500"><Icon name={icon} /></span>
      <span className="min-w-0 break-words">{text}</span>
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="flex items-start gap-3 text-stone-800 hover:text-burnt-dark"
        >
          {content}
        </a>
      ) : (
        <span className="flex items-start gap-3 text-stone-800">{content}</span>
      )}
    </li>
  );
}

type IconName = "mail" | "phone" | "globe" | "linkedin" | "pin" | "pencil";

function Icon({ name }: { name: IconName }) {
  if (name === "linkedin") {
    return (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    );
  }
  const paths: Record<Exclude<IconName, "linkedin">, string> = {
    mail: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.24a2.25 2.25 0 01-1.07 1.92l-7.5 4.61a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.92v-.24",
    phone: "M2.25 6.75c0 8.28 6.72 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.37c0-.52-.35-.97-.85-1.09l-4.42-1.1c-.44-.12-.9.05-1.17.41l-.97 1.3c-.28.37-.77.54-1.21.38a12.04 12.04 0 01-7.14-7.14c-.16-.44 0-.93.38-1.21l1.3-.97c.36-.27.52-.73.41-1.17L6.96 3.1a1.13 1.13 0 00-1.09-.85H4.5A2.25 2.25 0 002.25 4.5v2.25z",
    globe: "M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.49 0 4.5-4.03 4.5-9S14.49 3 12 3 7.5 7.03 7.5 12s2.01 9 4.5 9zM3.6 9h16.8M3.6 15h16.8",
    pin: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.14-7.5 11.25-7.5 11.25S4.5 17.64 4.5 10.5a7.5 7.5 0 1115 0z",
    pencil: "M16.86 4.49l1.69-1.69a1.88 1.88 0 112.65 2.65L10.58 16.07a4.5 4.5 0 01-1.9 1.13L6 18l.8-2.69a4.5 4.5 0 011.13-1.9l8.93-8.92z",
  };
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
