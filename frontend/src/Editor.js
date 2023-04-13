import React, { useState, useRef } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import styles from './styles.module.css';

const Editor = () => {
    const [showCover, setShowCover] = useState(true);
    const [code, setCode] = useState('// Type your C code here...');
    const [output, setOutput] = useState('');
    const codeRef = useRef(null);

    const dismissCover = () => {
        setShowCover(false);
    };

    const handleCodeChange = (value) => {
        setCode(value);
    };

    const executeCode = () => {
        if (codeRef.current !== null) {
            const file = new File([code], 'main.c', { type: 'text/plain' });
            const formData = new FormData();
            formData.append('file', file);
            fetch('http://localhost:3000/execute', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    setOutput(data);
                })
                .catch(error => {
                    console.error(error);
                    setOutput('An error occurred');
                });
        }
    };

    const handleEditorDidMount = (editor) => {
        codeRef.current = editor;
    }

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            {showCover && <div className={styles.cover}>
                <div className={styles.textButtonWrapper}>
                    <div className={styles.infobox}>
                        <p>C-interpreter on typescript</p>
                        <p>Created by: </p>
                        <p>Chen YuMing</p>
                        <p>David Liew Jing Der</p>
                        <p>Zhang Anli</p>
                    </div>
                    <button onClick={dismissCover}>Continue</button>
                </div>
            </div>}
            <div className={styles.container}>
                <div className={styles.editor}>
                    <MonacoEditor
                        height="100vh"
                        defaultLanguage="c"
                        defaultValue={code}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            wordWrap: 'on',
                        }}
                        onChange={handleCodeChange}
                        onMount={handleEditorDidMount}
                    />
                </div>
                <div className={styles.rightCol}>
                    <button onClick={executeCode}>Execute</button>
                    <>
                        {output.error ? < div className={styles.block}> Error: {output.error ? output.error : " - "}</div> :
                            <div className={styles.block}>Return: {output.result !== null ? output.result : " - "}</div>}
                        <div className={styles.block}>Console Log: {output.consoleOutput ? <pre>{output.consoleOutput}</pre> : " - "}</div>

                    </>
                </div>
            </div>
        </div >
    );
}

export default Editor;
