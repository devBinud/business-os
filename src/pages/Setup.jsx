import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { INDUSTRIES, INDUSTRY_MODULES, OPTIONAL_MODULES } from '../data/modules.js';
import { CURRENCIES, initials } from '../utils/format.js';
import { Field } from '../components/ui.jsx';
import { useForm } from '../utils/useForm.js';
import { optionalEmail, required } from '../utils/validation.js';

export const LOGO_COLORS = ['#24635f', '#2f4f7f', '#6b4f8a', '#8a4f3a', '#3f6b3a', '#475467'];

const STEPS = ['Business', 'Contact details', 'Modules'];

export default function Setup() {
  const { business, actions, role } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const form = useForm(
    { ...business, enabledModules: [...business.enabledModules] },
    { name: [required('Enter your business name')], email: [optionalEmail()] },
  );
  const v = form.values;

  const pickIndustry = (id) => {
    form.setValue('industry', id);
    form.setValue('enabledModules', [...INDUSTRY_MODULES[id]]);
  };

  const toggleModule = (id) =>
    form.setValue(
      'enabledModules',
      v.enabledModules.includes(id) ? v.enabledModules.filter((m) => m !== id) : [...v.enabledModules, id],
    );

  const next = () => {
    if (step === 0 && !v.name.trim()) return form.submit(() => {});
    if (step === 1) {
      let ok = false;
      form.submit(() => (ok = true));
      if (!ok) return undefined;
    }
    if (step < STEPS.length - 1) return setStep(step + 1);
    actions.completeSetup({
      name: v.name.trim(), industry: v.industry, logoColor: v.logoColor, email: v.email, phone: v.phone,
      address: v.address, currency: v.currency, enabledModules: v.enabledModules,
    });
    navigate('/dashboard');
    return undefined;
  };

  const skip = () => {
    actions.completeSetup({ name: business.name });
    navigate('/dashboard');
  };

  return (
    <div className="setup-page">
      <div className="setup-card stack" style={{ '--gap': '16px' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="small muted">Step {step + 1} of {STEPS.length} · {STEPS[step]}</div>
            <h1 style={{ fontSize: 22, fontWeight: 600 }}>Set up your business</h1>
          </div>
          <button className="btn ghost sm" type="button" onClick={skip}>
            Skip — use sample business
          </button>
        </div>
        <div className="steps" aria-hidden="true">
          {STEPS.map((s, i) => <span key={s} className={`step ${i <= step ? 'done' : ''}`} />)}
        </div>

        <form
          className="card pad stack"
          style={{ '--gap': '20px' }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          {step === 0 && (
            <>
              <div className="row wrap" style={{ gap: 20, alignItems: 'flex-start' }}>
                <div className="logo-drop" style={{ background: v.logoColor }} aria-label="Logo placeholder">
                  {initials(v.name) || '?'}
                </div>
                <div className="stack" style={{ '--gap': '10px', flex: 1, minWidth: 220 }}>
                  <Field label="Business name" error={form.errors.name}>
                    {(id) => <input id={id} {...form.bind('name')} placeholder="e.g. Summit View Hotel" />}
                  </Field>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>Logo placeholder colour</div>
                    <div className="swatches">
                      {LOGO_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`swatch ${v.logoColor === c ? 'on' : ''}`}
                          style={{ background: c }}
                          onClick={() => form.setValue('logoColor', c)}
                          aria-label={`Use colour ${c}`}
                        />
                      ))}
                    </div>
                    <div className="small muted" style={{ marginTop: 6 }}>Logo upload will be available in the full product.</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>Industry</div>
                <div className="module-pick">
                  {INDUSTRIES.map((ind) => (
                    <label key={ind.id} className={`module-option ${v.industry === ind.id ? 'on' : ''}`}>
                      <input type="radio" name="industry" checked={v.industry === ind.id} onChange={() => pickIndustry(ind.id)} />
                      <span>{ind.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="form-grid">
              <Field label="Business email" error={form.errors.email}>
                {(id) => <input id={id} type="email" {...form.bind('email')} />}
              </Field>
              <Field label="Phone">{(id) => <input id={id} type="tel" {...form.bind('phone')} />}</Field>
              <Field label="Address" className="full">{(id) => <input id={id} {...form.bind('address')} />}</Field>
              <Field label="Currency" hint="Used for all amounts in the demo.">
                {(id) => (
                  <select id={id} {...form.bind('currency', 'select')}>
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                )}
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="stack" style={{ '--gap': '12px' }}>
              <p className="muted">
                Choose the modules to show in your workspace. Dashboard, Customers, Employees and Settings are always
                included. Suggestions are based on your industry — you can change these later in Settings.
              </p>
              <div className="module-pick">
                {OPTIONAL_MODULES.map((m) => {
                  const on = v.enabledModules.includes(m.id);
                  return (
                    <label key={m.id} className={`module-option ${on ? 'on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleModule(m.id)} />
                      <span>
                        <span className="row" style={{ gap: 6, fontWeight: 500 }}><m.icon size={15} /> {m.label}</span>
                        <span className="d">{m.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="submit" className="btn primary">
              {step === STEPS.length - 1 ? (<><Check size={16} /> Finish setup</>) : (<>Continue <ArrowRight size={16} /></>)}
            </button>
          </div>
        </form>
        {role !== 'owner' && <p className="small muted">Only the business owner normally completes setup.</p>}
      </div>
    </div>
  );
}
