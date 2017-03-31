import tar from 'tar-stream';
import concat from 'concat-stream';
import { Transform } from 'stream';

export default class ManifestExtractor extends Transform {
  constructor(options) {
    super(options);
    this.extract = tar.extract();

    this.extract.on('entry', (header, stream, next) => {
      stream.pipe(concat((data) => {
        if (header.name === 'manifest.json') {
          const manifests = JSON.parse(data.toString());
          this.emit('manifests', manifests);
        }
        next();
      }));
    });

    this.extract.on('finish', () => {
      this.emit('finish');
    });

    this._transform = this._transform.bind(this);
    this._flush = this._flush.bind(this);
  }

  _transform(chunk, encoding, callback) {
    this.extract.write(chunk);
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    this.extract.end();
    this.push();
    callback();
  }
}
