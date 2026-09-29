import { Page } from '../components/Layout';
import { EmptyState } from '../components/EmptyState';
import { LinkButton } from '../components/Button';
import { paths } from '../state/router';

export function NotFoundPage({ message = 'Esta página no existe.' }: { message?: string }) {
  return (
    <Page back={paths.home()}>
      <EmptyState
        icon="🤷"
        title={message}
        action={
          <LinkButton href={paths.groups()} variant="secondary">
            Ir a mis grupos
          </LinkButton>
        }
      />
    </Page>
  );
}
