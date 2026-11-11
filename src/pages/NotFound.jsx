import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { EmptyState } from '../components/ui.jsx';

export default function NotFound({ title = 'Page not found', text = "The page or record you're looking for doesn't exist." }) {
  return (
    <div className="card" style={{ marginTop: 24 }}>
      <EmptyState icon={Search} title={title} action={<Link className="btn" to="/dashboard">Back to dashboard</Link>}>
        {text}
      </EmptyState>
    </div>
  );
}
