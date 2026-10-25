"""Checks release evidence consistency. Does not execute tests or certify security."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import subprocess
import sys

CONTROLS = ('riscos funcional servidor segredos autenticacao autorizacao uploads abuso '
            'dependencias regressao hospedagem recuperacao operacao revisao').split()
MANDATORY = set(CONTROLS) - {'autenticacao', 'autorizacao', 'uploads', 'servidor', 'abuso'}


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True,
                                   stderr=subprocess.PIPE).strip()


def validate(report, root, environment, now=None):
    errors = []
    now = now or dt.datetime.now(dt.timezone.utc)
    if report.get('schema') != 1:
        errors.append('schema deve ser 1')
    if environment not in {'staging', 'production'} or report.get('environment') != environment:
        errors.append('ambiente divergente ou invalido')
    for key in ('project', 'implementer', 'reviewer', 'operator', 'operation_plan'):
        if not isinstance(report.get(key), str) or not report[key].strip():
            errors.append('campo obrigatorio: ' + key)
    if report.get('reviewer') == report.get('implementer'):
        errors.append('revisor deve ser distinto do implementador')
    if report.get('findings') != []:
        errors.append('achados abertos ou lista ausente')
    try:
        stamp = dt.datetime.fromisoformat(report['checked_at'].replace('Z', '+00:00'))
        if stamp.tzinfo is None or not dt.timedelta(0) <= now-stamp <= dt.timedelta(days=7):
            errors.append('verificacao expirada, futura ou sem timezone')
    except (KeyError, TypeError, ValueError):
        errors.append('data invalida')
    evidence = report.get('evidence', {})
    if not isinstance(evidence, dict):
        evidence = {}
        errors.append('evidence deve ser objeto')
    valid = set()
    for eid, item in evidence.items():
        try:
            relative = Path(item['path'])
            path = (root / relative).resolve(strict=True)
            if relative.is_absolute() or not path.is_relative_to(root.resolve()) or not path.is_file():
                raise ValueError('arquivo fora do projeto')
            if hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
                raise ValueError('hash divergente')
            for key in ('command', 'expected', 'observed'):
                if not isinstance(item.get(key), str) or not item[key].strip():
                    raise ValueError('falta ' + key)
            valid.add(eid)
        except (KeyError, TypeError, ValueError, OSError) as exc:
            errors.append('evidencia invalida ' + str(eid) + ': ' + str(exc))
    controls = report.get('controls', {})
    if not isinstance(controls, dict):
        controls = {}
    for cid in CONTROLS:
        item = controls.get(cid, {})
        if not isinstance(item, dict):
            errors.append(cid + ': formato invalido')
            continue
        refs = item.get('evidence', [])
        if not isinstance(refs, list) or not refs or any(not isinstance(r, str) or r not in valid for r in refs):
            errors.append(cid + ': falta evidencia valida')
        state = item.get('status')
        if state == 'not_applicable' and cid not in MANDATORY:
            if not item.get('reason', '').strip() or item.get('reviewed_by') != report.get('reviewer'):
                errors.append(cid + ': N/A sem justificativa e revisao')
        elif state != 'passed':
            errors.append(cid + ': pendente, falhou ou N/A proibido')
    try:
        head = git(root, 'rev-parse', 'HEAD')
        commit = report.get('commit', '')
        if len(commit) != 40 or any(c not in '0123456789abcdef' for c in commit):
            raise ValueError('commit completo obrigatorio')
        git(root, 'merge-base', '--is-ancestor', commit, head)
        changes = git(root, 'diff', '--name-only', commit, head).splitlines()
        if any(not p.startswith(('docs/seguranca/', 'evidence/seguranca/')) for p in changes):
            errors.append('codigo alterado apos commit revisado')
        if git(root, 'status', '--porcelain', '--untracked-files=all'):
            errors.append('repositorio com alteracoes locais')
    except (subprocess.CalledProcessError, ValueError, OSError) as exc:
        errors.append('Git/commit invalido: ' + str(exc))
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report', type=Path)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--environment', choices=['staging', 'production'], required=True)
    args = parser.parse_args()
    try:
        report = json.loads(args.report.read_text(encoding='utf-8-sig'))
        if not isinstance(report, dict):
            raise ValueError('relatorio deve ser objeto')
        errors = validate(report, args.root.resolve(strict=True), args.environment)
        print(json.dumps({'status': 'blocked' if errors else 'evidence_consistent',
                          'errors': errors, 'security_certification': False}, ensure_ascii=False))
        return 1 if errors else 0
    except (ValueError, OSError, TypeError, AttributeError) as exc:
        print(json.dumps({'status': 'invalid', 'error': str(exc)}))
        return 2


if __name__ == '__main__':
    sys.exit(main())
