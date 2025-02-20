import { act, render, screen } from '@testing-library/react';
import React from 'react';

import config from 'app/core/config';
import { mockDataSource } from 'app/features/alerting/unified/mocks';
import { DataSourceType } from 'app/features/alerting/unified/utils/datasource';

import { PanelQueryRunner } from '../state/PanelQueryRunner';

import { Props, QueryGroup } from './QueryGroup';

const mockDS = mockDataSource({
  name: 'CloudManager',
  type: DataSourceType.Alertmanager,
});

const mockVariable = mockDataSource({
  name: '${dsVariable}',
  type: 'datasource',
});

jest.mock('@grafana/runtime/src/services/dataSourceSrv', () => {
  return {
    getDataSourceSrv: () => ({
      get: () => Promise.resolve({ ...mockDS, getRef: () => {} }),
      getList: ({ variables }: { variables: boolean }) => (variables ? [mockDS, mockVariable] : [mockDS]),
      getInstanceSettings: () => ({
        ...mockDS,
        meta: {
          ...mockDS.meta,
          alerting: true,
          mixed: true,
        },
      }),
    }),
  };
});

describe('QueryGroup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    config.expressionsEnabled = true;
  });
  it('Should add expression on click', async () => {
    renderScenario({});

    const addExpressionButton = await screen.findByTestId('query-tab-add-expression');
    const queryRowsContainer = await screen.findByTestId('query-editor-rows');
    expect(queryRowsContainer.children.length).toBe(2);

    await addExpressionButton.click();
    expect(queryRowsContainer.children.length).toBe(3);
  });

  it('Should add query on click', async () => {
    renderScenario({});

    const addQueryButton = await screen.findByTestId('query-tab-add-query');
    const queryRowsContainer = await screen.findByTestId('query-editor-rows');
    expect(queryRowsContainer.children.length).toBe(2);

    await addQueryButton.click();

    expect(queryRowsContainer.children.length).toBe(3);
  });

  it('New expression should be expanded', async () => {
    renderScenario({});

    const addExpressionButton = await screen.findByTestId('query-tab-add-expression');
    const queryRowsContainer = await screen.findByTestId('query-editor-rows');
    await addExpressionButton.click();

    const lastQueryEditorRow = (await screen.findAllByTestId('query-editor-row')).at(-1);
    const lastEditorToggleRow = (await screen.findAllByLabelText('toggle collapse and expand query row')).at(-1);

    expect(lastEditorToggleRow?.getAttribute('aria-expanded')).toBe('true');
    expect(lastQueryEditorRow?.firstElementChild?.children.length).toBe(2);
    expect(queryRowsContainer.children.length).toBe(3);
  });

  it('New query should be expanded', async () => {
    renderScenario({});

    const addQueryButton = await screen.findByTestId('query-tab-add-query');
    const queryRowsContainer = await screen.findByTestId('query-editor-rows');
    await addQueryButton.click();

    const lastQueryEditorRow = (await screen.findAllByTestId('query-editor-row')).at(-1);
    const lastEditorToggleRow = (await screen.findAllByLabelText('toggle collapse and expand query row')).at(-1);

    expect(lastEditorToggleRow?.getAttribute('aria-expanded')).toBe('true');
    expect(lastQueryEditorRow?.firstElementChild?.children.length).toBe(2);
    expect(queryRowsContainer.children.length).toBe(3);
  });

  it('Should open data source help modal', async () => {
    renderScenario({});

    const openHelpButton = await screen.findByTestId('query-tab-help-button');
    await act(async () => {
      await openHelpButton.click();
    });

    const helpModal = await screen.findByRole('dialog');
    expect(helpModal).toBeInTheDocument();
  });

  it('Should not show add expression button when expressions are disabled', async () => {
    config.expressionsEnabled = false;
    renderScenario({});
    const addExpressionButton = screen.queryByTestId('query-tab-add-expression');
    expect(addExpressionButton).not.toBeInTheDocument();
  });
});

function renderScenario(overrides: Partial<Props>) {
  const props: Props = {
    onOptionsChange: jest.fn(),
    queryRunner: new PanelQueryRunner({
      getDataSupport: jest.fn(),
      getFieldOverrideOptions: jest.fn(),
      getTransformations: jest.fn(),
    }),
    options: {
      queries: [
        {
          datasource: mockDS,
          refId: 'A',
        },
        {
          datasource: mockDS,
          refId: 'B',
        },
      ],
      dataSource: mockDS,
    },
    onRunQueries: function (): void {
      throw new Error('Function not implemented.');
    },
  };

  Object.assign(props, overrides);

  return {
    props,
    renderResult: render(<QueryGroup {...props} />),
  };
}
