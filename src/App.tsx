import { useRoute } from './state/router';
import { HomePage } from './pages/HomePage';
import { GroupsPage } from './pages/GroupsPage';
import { NewGroupPage } from './pages/NewGroupPage';
import { GroupPage } from './pages/GroupPage';
import { ExpenseFormPage } from './pages/ExpenseFormPage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { JoinPage } from './pages/JoinPage';

export default function App() {
  const route = useRoute();

  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'groups':
      return <GroupsPage />;
    case 'new-group':
      return <NewGroupPage />;
    case 'join':
      return <JoinPage key={route.code} initialCode={route.code} />;
    case 'group':
      return <GroupPage groupId={route.groupId} tab={route.tab} />;
    case 'new-expense':
      return <ExpenseFormPage groupId={route.groupId} />;
    case 'edit-expense':
      return <ExpenseFormPage groupId={route.groupId} expenseId={route.expenseId} />;
    case 'expense':
      return <ExpenseDetailPage groupId={route.groupId} expenseId={route.expenseId} />;
    case 'not-found':
      return <NotFoundPage />;
  }
}
